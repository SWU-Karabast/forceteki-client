import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, type GameEvent, type ReducedState, type SwuPgnDocument } from '@/lib/swupgn';
import { resourcingReport } from '../resourcingReport';

const SAMPLE = readFileSync(
    path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/sample-game.swupgn'),
    'utf-8',
);
const BASE = parse(SAMPLE);

function docWith(events: GameEvent[]): SwuPgnDocument {
    return { ...BASE, events };
}

// Minimal keyframe with the two players' ready-resource counts; other fields don't matter.
function keyframe(p1Ready: number, p2Ready: number): ReducedState {
    const mk = (seat: 1 | 2, ready: number) => ({
        seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [],
        resourcesReady: ready, resourcesExhausted: 0, credits: 0, hasForce: false,
        discard: [], cards: [],
    });
    return { round: 1, phase: 'action', initiative: 1, players: { 1: mk(1, p1Ready), 2: mk(2, p2Ready) } };
}

describe('resourcingReport — explicit PLAY events with cost', () => {
    const events: GameEvent[] = [
        { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: keyframe(5, 4) },
        { seq: 'R1.G.1', t: 'DRAW', p: 1, count: 3, cards: ['A', 'B', 'C'] },
        { seq: 'R1.A.1', t: 'PLAY', p: 1, card: 'A', cost: 3 },
        { seq: 'R1.A.2', t: 'PLAY', p: 1, card: 'B', cost: 1 },
        { seq: 'R1.A.3', t: 'MOVE', p: 1, card: 'C', from: 'hand', to: 'resource' },
    ];
    const rep = resourcingReport(docWith(events));

    it('computes pool, spend, and float from cost-bearing plays + keyframe', () => {
        const r1 = rep.byRound.find((b) => b.seat === 1 && b.round === 1)!;
        expect(r1.pool).toBe(5);
        expect(r1.played).toBe(2);
        expect(r1.spent).toBe(4);
        expect(r1.float).toBe(1);
        expect(r1.underspent).toBe(false);
        expect(r1.resourced).toBe(1);
        expect(r1.drawn).toBe(3);
        expect(rep.hasCostData).toBe(true);
    });

    it('flags drawn-but-never-played and resourced-from-hand exactly', () => {
        const s = rep.summary[1];
        expect(s.drawnNeverPlayed).toEqual(['C']); // A,B played; C resourced
        expect(s.resourcedFromHand).toBe(1);
        expect(s.totalSpent).toBe(4);
        expect(s.avgEfficiency).toBeCloseTo(0.8);
    });
});

describe('resourcingReport — underspend flag', () => {
    it('flags a round that left >= threshold resources unspent', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: keyframe(6, 6) },
            { seq: 'R1.A.1', t: 'PLAY', p: 1, card: 'A', cost: 2 },
        ];
        const r1 = resourcingReport(docWith(events)).byRound.find((b) => b.seat === 1)!;
        expect(r1.float).toBe(4);
        expect(r1.underspent).toBe(true);
    });
});

describe('resourcingReport — MOVE-only log (no PLAY events) uses cost map', () => {
    const events: GameEvent[] = [
        { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: keyframe(3, 3) },
        { seq: 'R1.G.1', t: 'DRAW', p: 1, count: 2, cards: ['U', 'V'] },
        { seq: 'R1.A.1', t: 'MOVE', p: 1, card: 'U', from: 'hand', to: 'ground' },
        { seq: 'R1.A.2', t: 'MOVE', p: 1, card: 'V', from: 'hand', to: 'resource' },
    ];
    const rep = resourcingReport(docWith(events), { U: 2 });

    it('derives plays from hand->arena moves and costs from the map', () => {
        const r1 = rep.byRound.find((b) => b.seat === 1)!;
        expect(r1.played).toBe(1);   // U played; V resourced (not a play)
        expect(r1.resourced).toBe(1);
        expect(r1.spent).toBe(2);
        expect(r1.float).toBe(1);
        expect(rep.hasCostData).toBe(true);
    });

    it('counts V as drawn-but-never-played (resourced instead)', () => {
        const s = rep.summary[1];
        expect(s.drawnNeverPlayed).toEqual(['V']);
        expect(s.resourcedFromHand).toBe(1);
    });
});

describe('resourcingReport — no cost data degrades gracefully', () => {
    it('reports counts but null spend/float when costs are unknown', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: keyframe(4, 4) },
            { seq: 'R1.A.1', t: 'PLAY', p: 1, card: 'A' }, // no cost, empty cost map
        ];
        const rep = resourcingReport(docWith(events));
        const r1 = rep.byRound.find((b) => b.seat === 1)!;
        expect(r1.played).toBe(1);
        expect(r1.spent).toBeNull();
        expect(r1.float).toBeNull();
        expect(rep.hasCostData).toBe(false);
    });
});

describe('resourcingReport — only hand->resource counts as resourcing', () => {
    it('ignores cards entering resources from outsideTheGame/deck (setup dumps, effects)', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: keyframe(3, 3) },
            { seq: 'R1.S.1', t: 'MOVE', p: 1, card: 'X', from: 'outsideTheGame', to: 'resource' },
            { seq: 'R1.S.2', t: 'MOVE', p: 1, card: 'Y', from: 'deck', to: 'resource' },
            { seq: 'R1.A.1', t: 'MOVE', p: 1, card: 'Z', from: 'hand', to: 'resource' },
        ];
        const r1 = resourcingReport(docWith(events)).byRound.find((b) => b.seat === 1)!;
        expect(r1.resourced).toBe(1); // only Z (from hand)
    });
});

describe('resourcingReport — real sample game', () => {
    it('produces a report without throwing (MOVE-only, no cost map)', () => {
        const rep = resourcingReport(BASE, {});
        expect(rep.rounds.length).toBeGreaterThan(0);
        expect(rep.summary[1]).toBeDefined();
        expect(rep.summary[2]).toBeDefined();
        // Both players drew their opening hands.
        expect(rep.summary[1].totalDrawn).toBeGreaterThan(0);
        expect(rep.summary[2].totalDrawn).toBeGreaterThan(0);
    });
});
