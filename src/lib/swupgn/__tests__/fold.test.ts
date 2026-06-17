import { describe, it, expect } from 'vitest';
import { fold, foldFrames, reduce, stateAt } from '../index';
import type { GameEvent, ReducedState, PlayerState } from '../index';

// Fresh default state (players 1/2, baseHp 30, empty everywhere).
const base = (): ReducedState => fold([]);
const p1 = (s: ReducedState): PlayerState => s.players[1]!;

// Minimal keyframe builder; only the fields a given test asserts need to be meaningful.
function keyframe(over: { p1?: Partial<PlayerState>; p2?: Partial<PlayerState>; round?: number } = {}): ReducedState {
    const mk = (seat: 1 | 2, patch: Partial<PlayerState> = {}): PlayerState => ({
        seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [],
        resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false,
        discard: [], cards: [], ...patch,
    });
    return {
        round: over.round ?? 1, phase: 'action', initiative: 1,
        players: { 1: mk(1, over.p1), 2: mk(2, over.p2) },
    };
}

describe('reduce — MOVE drives the gated counts', () => {
    it('hand in/out adjusts handSize and never goes negative', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'A', from: 'deck', to: 'hand', p: 1 });
        expect(p1(s).handSize).toBe(1);
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'A', from: 'hand', to: 'ground', p: 1 });
        expect(p1(s).handSize).toBe(0);
        // A spurious extra hand-exit must not drive the count below zero.
        s = reduce(s, { seq: '3', t: 'MOVE', card: 'B', from: 'hand', to: 'discard', p: 1 });
        expect(p1(s).handSize).toBe(0);
    });

    it('resource in/out adjusts resourcesReady', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'A', from: 'hand', to: 'resource', p: 1 });
        expect(p1(s).resourcesReady).toBe(1);
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'A', from: 'resource', to: 'discard', p: 1 });
        expect(p1(s).resourcesReady).toBe(0);
    });

    it('arena placement is idempotent: PLAY then the paired hand->arena MOVE do not double-add', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'PLAY', p: 1, card: 'U', zone: 'ground' });
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        expect(p1(s).cards.filter((c) => c.id === 'U')).toHaveLength(1);
    });

    it('removes a card when it exits the arena', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeTruthy();
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'U', from: 'ground', to: 'discard', p: 1 });
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeUndefined();
    });
});

describe('reduce — combat & token state', () => {
    it('DAMAGE to a base sets baseHp from the event hp; to a unit accumulates damage', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'DAMAGE', src: 'x', tgt: 'base@1', amt: 5, damageType: 'n', hp: 25 });
        expect(p1(s).baseHp).toBe(25);
        s = reduce(s, { seq: '3', t: 'DAMAGE', src: 'x', tgt: 'U', amt: 2, damageType: 'n', hp: 0 });
        expect(p1(s).cards.find((c) => c.id === 'U')!.damage).toBe(2);
    });

    it('HEAL on a unit clamps damage at 0', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'DAMAGE', src: 'x', tgt: 'U', amt: 2, damageType: 'n', hp: 0 });
        s = reduce(s, { seq: '3', t: 'HEAL', tgt: 'U', amt: 5, hp: 0 });
        expect(p1(s).cards.find((c) => c.id === 'U')!.damage).toBe(0);
    });

    it('DEFEAT moves the card id to discard and removes it from play', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'DEFEAT', card: 'U', reason: 'combat' });
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeUndefined();
        expect(p1(s).discard).toContain('U');
    });

    it('PLAY_UPGRADE attaches to a known host, else tracks as its own instance', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'HOST', from: 'hand', to: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'PLAY_UPGRADE', p: 1, card: 'UP', target: 'HOST' });
        expect(p1(s).cards.find((c) => c.id === 'HOST')!.upgrades).toContain('UP');
        // Unknown host -> the upgrade becomes its own tracked card (fallback).
        s = reduce(s, { seq: '3', t: 'PLAY_UPGRADE', p: 1, card: 'ORPHAN', target: 'NOPE' });
        expect(p1(s).cards.find((c) => c.id === 'ORPHAN')).toBeTruthy();
    });

    it('SHIELD_USE clamps at 0; EXPERIENCE_GAIN and STATUS_TOKEN accumulate', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'SHIELD_USE', card: 'U', count: 3 });
        expect(p1(s).cards.find((c) => c.id === 'U')!.shields).toBe(0);
        s = reduce(s, { seq: '3', t: 'EXPERIENCE_GAIN', card: 'U', count: 2 });
        expect(p1(s).cards.find((c) => c.id === 'U')!.experience).toBe(2);
        s = reduce(s, { seq: '4', t: 'STATUS_TOKEN', card: 'U', token: 'shield', count: 1 });
        s = reduce(s, { seq: '5', t: 'STATUS_TOKEN', card: 'U', token: 'shield', count: 2 });
        expect(p1(s).cards.find((c) => c.id === 'U')!.statusTokens.shield).toBe(3);
    });
});

describe('fold / foldFrames / stateAt', () => {
    const events: GameEvent[] = [
        { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: keyframe({ p1: { baseHp: 20 } }) },
        { seq: 'R1.A.1', t: 'MOVE', card: 'A', from: 'deck', to: 'hand', p: 1 },
        { seq: 'R1.A.2', t: 'DAMAGE', src: 'x', tgt: 'base@1', amt: 5, damageType: 'n', hp: 18 },
        // U enters play from deck (not hand), so handSize is unaffected by this move.
        { seq: 'R1.A.3', t: 'MOVE', card: 'U', from: 'deck', to: 'ground', p: 1 },
    ];

    it('fold snaps to a ROUND_START keyframe, then keeps folding', () => {
        const s = fold(events);
        expect(p1(s).baseHp).toBe(18); // keyframe 20, then DAMAGE set hp 18
        expect(p1(s).handSize).toBe(1); // A drawn to hand; U entered from deck
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeTruthy();
    });

    it('foldFrames matches fold(prefix) at every index', () => {
        const frames = foldFrames(events);
        expect(frames).toHaveLength(events.length);
        for (let i = 0; i < events.length; i++) {
            expect(frames[i]).toEqual(fold(events.slice(0, i + 1)));
        }
    });

    it('foldFrames snapshots are independent (a later reduce cannot mutate an earlier frame)', () => {
        const frames = foldFrames(events);
        // Frame 1 was before the base damage; its baseHp must stay at the keyframe value.
        expect(p1(frames[1]).baseHp).toBe(20);
        expect(p1(frames[2]).baseHp).toBe(18);
    });

    it('stateAt folds up to (and including) a seq', () => {
        const s = stateAt(events, 'R1.A.2');
        expect(p1(s).baseHp).toBe(18);
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeUndefined(); // U comes after
    });
});
