import { describe, it, expect } from 'vitest';
import { checkKeyframes } from '../index';
import type { GameEvent, ReducedState, PlayerState, CardInstanceState } from '../index';

const mkCard = (id: string, over: Partial<CardInstanceState> = {}): CardInstanceState => ({
    id, zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 0,
    experience: 0, statusTokens: {}, captured: [], ...over,
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
            // Fold after the above: p1 handSize 1 (holding A), baseHp 25, one ground card U.
            // `hand` is gated as a set now, so the keyframe has to name the card the MOVE named.
            { seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: kf({ handSize: 1, hand: ['A'], baseHp: 25, cards: [mkCard('U')] }) },
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

describe('checkKeyframes — the §11 fields added alongside resources/baseEpicActionUsed/onStartingSide', () => {
    it('flags hand and discard CONTENTS, not just their counts', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: EMPTY_KF },
            { seq: 'R1.A.1', t: 'MOVE', card: 'A', from: 'deck', to: 'hand', p: 1 },
            { seq: 'R1.A.2', t: 'MOVE', card: 'B', from: 'hand', to: 'discard', p: 1 },
            // The fold actually holds A and has discarded nothing named B is wrong here too --
            // the keyframe claims a different hand card and a different discard pile.
            { seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: kf({ handSize: 1, hand: ['Z'], discard: ['Y'] }) },
        ];
        const res = checkKeyframes(events);
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.hand', expected: ['Z'], got: ['A'] });
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.discard', expected: ['Y'], got: ['B'] });
    });

    it('flags the resource row MEMBERSHIP as a set, ignoring order', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: EMPTY_KF },
            { seq: 'R1.A.1', t: 'MOVE', card: 'A', from: 'hand', to: 'resource', p: 1 },
            { seq: 'R1.A.2', t: 'MOVE', card: 'B', from: 'hand', to: 'resource', p: 1 },
            // Order-independent: a keyframe naming the same two ids in the other order is not
            // a mismatch, but naming a different id is.
            { seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: kf({ resourcesReady: 2, resources: ['B', 'A'] }) },
        ];
        expect(checkKeyframes(events).mismatches).toEqual([]);

        const wrong = events.slice(0, -1).concat({
            seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: kf({ resourcesReady: 2, resources: ['A', 'C'] }),
        });
        const res = checkKeyframes(wrong);
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.resources', expected: ['A', 'C'], got: ['A', 'B'] });
    });

    it('flags the BASE\'s Epic Action only when the keyframe states one', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: EMPTY_KF },
            { seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'base@1', epic: true },
            { seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: kf({ baseEpicActionUsed: false }) },
        ];
        const res = checkKeyframes(events);
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.baseEpicActionUsed', expected: false, got: true });
        // A keyframe from a writer that never states it is not a mismatch (absent, not false).
        const silent = events.slice(0, -1).concat({ seq: 'R1.E.0', t: 'ROUND_END', round: 1, keyframe: kf({}) });
        expect(checkKeyframes(silent).mismatches).toEqual([]);
    });

    it('flags a double-sided leader\'s onStartingSide only when the keyframe states one', () => {
        const events: GameEvent[] = [
            { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: EMPTY_KF },
            { seq: 'R1.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false },
            {
                seq: 'R1.E.0', t: 'ROUND_END', round: 1,
                keyframe: kf({ leader: { id: 'TWI#017', deployed: false, exhausted: false, epicActionUsed: false, onStartingSide: true } }),
            },
        ];
        const res = checkKeyframes(events);
        expect(res.mismatches).toContainEqual({ seq: 'R1.E.0', path: 'players.1.leader.onStartingSide', expected: true, got: false });
    });
});

describe('checkKeyframes on an untyped keyframe', () => {
    it('does not throw when a seat lacks cards or the keyframe is a primitive', async () => {
        const { checkKeyframes } = await import('../integrity');
        const events = [
            { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: {}, 2: null } } },
            { seq: 'R1.end', t: 'ROUND_END', round: 1, keyframe: 5 },
        ] as unknown as Parameters<typeof checkKeyframes>[0];
        expect(() => checkKeyframes(events)).not.toThrow();
    });
});

describe('a keyframe that passes isCompleteKeyframe but has malformed cards', () => {
    // `isCompleteKeyframe` only proves cards/hand/discard are arrays and each card is SOME
    // object. Upstream deep-clones the raw keyframe here, so a card missing `statusTokens` or
    // `upgrades` rode into reduce() and threw. FileHealth runs checkKeyframes on an uploaded
    // file inside a render-time useMemo with no error boundary, so that blanked the Replay
    // page for anyone who opened the file. The client snaps through fold's normalization.
    const withCard = (card: object, then: GameEvent): GameEvent[] => [
        { seq: 'R1.S.0', t: 'ROUND_START', round: 1, keyframe: {
            round: 1, phase: 'action', initiative: 1,
            players: { 1: { seat: 1, cards: [card], hand: [], discard: [] }, 2: mkPlayer(2) },
        } } as unknown as GameEvent,
        then,
    ];

    it('survives a STATUS_TOKEN on a card with no statusTokens', () => {
        const events = withCard({ id: 'HOST', zone: 'ground' },
            { seq: 'R1.A.1', t: 'STATUS_TOKEN', card: 'HOST', token: 'shield', count: 1 } as unknown as GameEvent);
        expect(() => checkKeyframes(events)).not.toThrow();
    });

    it('survives an arena exit on a card with no upgrades', () => {
        const events = withCard({ id: 'HOST', zone: 'ground' },
            { seq: 'R1.A.1', t: 'MOVE', card: 'HOST', from: 'ground', to: 'discard', p: 1 } as unknown as GameEvent);
        expect(() => checkKeyframes(events)).not.toThrow();
    });

    it('still folds the coerced card, rather than dropping the seat', () => {
        const s = checkKeyframes(withCard({ id: 'HOST', zone: 'ground' },
            { seq: 'R1.A.1', t: 'SHIELD_GAIN', card: 'HOST', count: 1 } as unknown as GameEvent));
        // A damaged-card keyframe is not a damaged KEYFRAME: it snaps, so no §13 mismatch.
        expect(s.mismatches.filter((m) => m.path === 'keyframe')).toEqual([]);
    });
});
