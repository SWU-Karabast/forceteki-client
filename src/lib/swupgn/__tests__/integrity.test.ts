import { describe, it, expect } from 'vitest';
import { checkKeyframes } from '../index';
import type { GameEvent, ReducedState, PlayerState, CardInstanceState } from '../index';

const mkCard = (id: string, over: Partial<CardInstanceState> = {}): CardInstanceState => ({
    id, zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 0,
    experience: 0, statusTokens: {}, ...over,
});

const mkPlayer = (seat: 1 | 2, over: Partial<PlayerState> = {}): PlayerState => ({
    seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [],
    resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false,
    discard: [], cards: [], ...over,
});

const kf = (p1: Partial<PlayerState>, p2: Partial<PlayerState> = {}, round = 1): ReducedState => ({
    round, phase: 'action', initiative: 1, players: { 1: mkPlayer(1, p1), 2: mkPlayer(2, p2) },
});

// The running fold starts at the default empty state (baseHp 30, no cards), so the first
// keyframe must equal that empty state to pass; subsequent state is driven by events.
const EMPTY_KF = kf({}, {});

describe('checkKeyframes — happy path', () => {
    it('reports ok when the fold reconstructs each keyframe exactly', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: EMPTY_KF },
            { seq: 'R1.A.1', t: 'MOVE', card: 'A', from: 'deck', to: 'hand', p: 1 },
            { seq: 'R1.A.2', t: 'DAMAGE', src: 'x', tgt: 'base@1', amt: 5, damageType: 'n', hp: 25 },
            { seq: 'R1.A.3', t: 'MOVE', card: 'U', from: 'deck', to: 'ground', p: 1 },
            // Fold after the above: p1 handSize 1, baseHp 25, one ground card U.
            { seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: kf({ handSize: 1, baseHp: 25, cards: [mkCard('U')] }) },
        ];
        const res = checkKeyframes(events);
        expect(res.ok).toBe(true);
        expect(res.mismatches).toEqual([]);
    });
});

describe('checkKeyframes — mismatch detection', () => {
    const events = (endKf: ReducedState): GameEvent[] => [
        { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: EMPTY_KF },
        { seq: 'R1.A.1', t: 'MOVE', card: 'A', from: 'deck', to: 'hand', p: 1 },
        { seq: 'R1.A.2', t: 'DAMAGE', src: 'x', tgt: 'base@1', amt: 5, damageType: 'n', hp: 25 },
        { seq: 'R1.A.3', t: 'MOVE', card: 'U', from: 'deck', to: 'ground', p: 1 },
        { seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: endKf },
    ];

    it('flags a wrong baseHp with expected (keyframe) vs got (fold)', () => {
        const res = checkKeyframes(events(kf({ handSize: 1, baseHp: 99, cards: [mkCard('U')] })));
        expect(res.ok).toBe(false);
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.baseHp', expected: 99, got: 25 });
    });

    it('flags a wrong handSize', () => {
        const res = checkKeyframes(events(kf({ handSize: 7, baseHp: 25, cards: [mkCard('U')] })));
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.handSize', expected: 7, got: 1 });
    });

    it('flags an in-play card the keyframe omits (got present, expected absent)', () => {
        const res = checkKeyframes(events(kf({ handSize: 1, baseHp: 25, cards: [] })));
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.cards[U]', expected: 'absent', got: 'present' });
    });

    it('flags a per-card field mismatch (damage)', () => {
        const res = checkKeyframes(events(kf({ handSize: 1, baseHp: 25, cards: [mkCard('U', { damage: 3 })] })));
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.cards[U].damage', expected: 3, got: 0 });
    });
});
