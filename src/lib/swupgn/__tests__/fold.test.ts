import { describe, it, expect } from 'vitest';
import { fold, foldFrames, reduce, stateAt, isCompleteKeyframe, normalizeTokenEvents, dropInertRecords, normalizeEvents, repairUpgradePlays, isStatusTokenCard, tokenArtId, parse, checkKeyframes } from '../index';
import type { GameEvent, ReducedState, PlayerState } from '../index';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const SAMPLE = readFileSync(path.join(__dirname, 'fixtures/sample-game.swupgn'), 'utf-8');

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

    it('arena placement is idempotent in the real-log order: MOVE hand->arena THEN PLAY', () => {
        // This is the order real engine streams emit (MOVE first, PLAY summary second);
        // pushing in PLAY unconditionally used to create a duplicate in-play instance.
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'JTL#198', from: 'hand', to: 'space', p: 1 });
        s = reduce(s, { seq: '2', t: 'PLAY', p: 1, card: 'JTL#198', zone: 'space' });
        expect(p1(s).cards.filter((c) => c.id === 'JTL#198')).toHaveLength(1);
    });

    it('removes a card when it exits the arena', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeTruthy();
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'U', from: 'ground', to: 'discard', p: 1 });
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeUndefined();
    });
});

describe('reduce — hand & discard contents (MOVE-driven, no double-add)', () => {
    it('hand[] reflects the current hand; a DRAW does NOT re-add a card the MOVE already added', () => {
        let s = base();
        // deck->hand MOVE adds the card; the paired DRAW summary lists the same id.
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'SEC#163', from: 'deck', to: 'hand', p: 1 });
        s = reduce(s, { seq: '2', t: 'DRAW', p: 1, count: 1, cards: ['SEC#163'] });
        // Exactly one copy — this is the duplicate-React-key regression.
        expect(p1(s).hand.filter((id) => id === 'SEC#163')).toHaveLength(1);
        expect(p1(s).handSize).toBe(1);
    });

    it('playing a card removes it from hand[] (MOVE hand->arena)', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'SEC#163', from: 'deck', to: 'hand', p: 1 });
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'SEC#163', from: 'hand', to: 'ground', p: 1 });
        expect(p1(s).hand).not.toContain('SEC#163');
        expect(p1(s).handSize).toBe(0);
    });

    it('discard membership follows MOVE and de-dupes a defeat that also moves to discard', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'deck', to: 'ground', p: 1 });
        // Both a DEFEAT and a ground->discard MOVE reference the same card; no double-add.
        s = reduce(s, { seq: '2', t: 'DEFEAT', card: 'U', reason: 'attack' });
        s = reduce(s, { seq: '3', t: 'MOVE', card: 'U', from: 'ground', to: 'discard', p: 1 });
        expect(p1(s).discard.filter((id) => id === 'U')).toHaveLength(1);
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
        s = reduce(s, { seq: '2', t: 'DEFEAT', card: 'U', reason: 'attack' });
        expect(p1(s).cards.find((c) => c.id === 'U')).toBeUndefined();
        expect(p1(s).discard).toContain('U');
    });

    it('PLAY_UPGRADE attaches to a known host and never becomes an arena card', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'PLAY', card: 'HOST', zone: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'PLAY_UPGRADE', p: 1, card: 'UPG', target: 'HOST' });
        expect(p1(s).cards.find((c) => c.id === 'HOST')!.upgrades).toEqual(['UPG']);
        // An untracked host used to fall back to placing the upgrade in the arena, which put
        // a phantom "unit" on the board that no keyframe agreed with. If the host isn't
        // tracked the attachment simply isn't modelled.
        s = reduce(s, { seq: '3', t: 'PLAY_UPGRADE', p: 1, card: 'ORPHAN', target: 'MISSING' });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['HOST']);
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

    // Value: protects=token/shield/xp counts from an uploaded file never go NaN or read inherited keys; fails_when=countOr or own-key token lookup reverted; why_new=no test fed non-numeric counts or prototype-named tokens; seam=none; no_claim=no UI rendering of tokens
    it('a non-numeric count falls back, and a reserved token name never becomes a key (§23)', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 });
        const u = () => p1(s).cards.find((c) => c.id === 'U')!;
        s = reduce(s, { seq: '2', t: 'SHIELD_GAIN', card: 'U', count: 'x' } as unknown as GameEvent);
        expect(u().shields).toBe(1);
        s = reduce(s, { seq: '3', t: 'EXPERIENCE_GAIN', card: 'U', count: null } as unknown as GameEvent);
        expect(u().experience).toBe(0);
        s = reduce(s, { seq: '4', t: 'STATUS_TOKEN', card: 'U', token: 'advantage', count: 'NaN' } as unknown as GameEvent);
        expect(u().statusTokens).toEqual({});
        // parse() refuses a reserved token name; reduce() is public, so events built without
        // parse() get the same guard: the record does nothing.
        s = reduce(s, { seq: '5', t: 'STATUS_TOKEN', card: 'U', token: 'constructor', count: 2 });
        s = reduce(s, { seq: '6', t: 'STATUS_TOKEN', card: 'U', token: '__proto__', count: 1 });
        s = reduce(s, { seq: '7', t: 'STATUS_TOKEN', card: 'U', token: 'hasOwnProperty', count: 1 });
        s = reduce(s, { seq: '7a', t: 'STATUS_TOKEN', card: 'U', token: 'advantage', count: 1 });
        expect(Object.getOwnPropertyNames(u().statusTokens)).toEqual(['advantage']);
        expect(() => String(u().statusTokens)).not.toThrow();
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(Object.getPrototypeOf(u().statusTokens)).toBe(Object.prototype);
        // A non-string token name is not a token.
        s = reduce(s, { seq: '8', t: 'STATUS_TOKEN', card: 'U', token: 7, count: 1 } as unknown as GameEvent);
        expect(Object.keys(u().statusTokens)).toHaveLength(1);
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

describe('keyframes are merged per seat, not replaced wholesale', () => {
    // forceteki has emitted keyframes carrying only one seat (or `"players": {}`).
    // A wholesale replace drops the omitted seat entirely, which leaves the board with
    // `gameState.players[connectedPlayer]` undefined and crashes the card trays.
    const partial = (round: number, seats: (1 | 2)[]): ReducedState => {
        const full = keyframe({ round, p1: { baseHp: 20 }, p2: { baseHp: 25 } });
        for (const seat of [1, 2] as const) if (!seats.includes(seat)) delete full.players[seat];
        return full;
    };

    it('keeps the folded state for a seat the keyframe omits', () => {
        const events: GameEvent[] = [
            { seq: '1', t: 'MOVE', card: 'A', from: 'deck', to: 'hand', p: 1 },
            { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: partial(2, [2]) },
        ];
        const s = fold(events);
        expect(s.players[1]).toBeDefined();
        expect(s.players[1]!.hand).toEqual(['A']);   // survived the snap
        expect(s.players[2]!.baseHp).toBe(25);       // seat present in the keyframe wins
    });

    it('an empty players map leaves both seats intact', () => {
        const events: GameEvent[] = [
            { seq: 'R4.start', t: 'ROUND_START', round: 4, keyframe: partial(4, []) },
        ];
        for (const s of foldFrames(events)) {
            expect(s.players[1]).toBeDefined();
            expect(s.players[2]).toBeDefined();
        }
    });
});

describe('TOKEN: pseudo-cards never become board cards', () => {
    // Status tokens ride the stream as `TOKEN:<Name>[:copy]` with their own MOVE/DEFEAT
    // events. They have no set id, so treating them as arena units renders a card whose
    // image cannot resolve. Their effect is carried by STATUS_TOKEN on the host instead.
    it('a token moved into an arena is ignored, but STATUS_TOKEN still lands', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'PLAY', card: 'SEC#215', zone: 'space', p: 1 });
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'TOKEN:Advantage', from: 'outsideTheGame', to: 'space', p: 1 });
        s = reduce(s, { seq: '3', t: 'STATUS_TOKEN', card: 'SEC#215', token: 'advantage', count: 1 });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['SEC#215']);
        expect(p1(s).cards[0].statusTokens).toEqual({ advantage: 1 });
    });

    it('a defeated token is not pushed into the discard pile', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'DEFEAT', card: 'TOKEN:Advantage:2', reason: 'ability' });
        expect(p1(s).discard).toEqual([]);
    });
});

describe('normalizeTokenEvents — the removal the stream never emits', () => {
    // Gaining a token is a TOKEN: MOVE into an arena followed by the HOST's STATUS_TOKEN.
    // Losing it is a MOVE back to outsideTheGame plus a DEFEAT — and no decrement, so a
    // literal read leaves the badge on the unit for the rest of the game.
    // (The Advantage token itself is an Ashes of the Empire token; the host below is an
    // ASH unit only to keep that association clear — any unit can carry one.)
    const lifecycle: GameEvent[] = [
        { seq: '1', t: 'PLAY', card: 'ASH#220', zone: 'ground', p: 1 },
        { seq: '2', t: 'MOVE', card: 'TOKEN:Advantage', from: 'outsideTheGame', to: 'ground', p: 1 },
        { seq: '3', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: 1 },
        { seq: '4', t: 'MOVE', card: 'TOKEN:Advantage', from: 'ground', to: 'outsideTheGame', p: 1 },
        { seq: '5', t: 'DEFEAT', card: 'TOKEN:Advantage', reason: 'ability' },
    ];

    it('leaves the badge stuck without normalization', () => {
        expect(p1(fold(lifecycle)).cards[0].statusTokens).toEqual({ advantage: 1 });
    });

    it('rewrites the move-out into the host decrement, keeping seq', () => {
        const fixed = normalizeTokenEvents(lifecycle);
        expect(fixed).toHaveLength(lifecycle.length);
        expect(fixed[3]).toEqual({ seq: '4', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: -1 });
        // Deleted, not zeroed: an engine keyframe reports an untokened host as `{}` and the
        // integrity gate compares by JSON equality.
        expect(p1(fold(fixed)).cards[0].statusTokens).toEqual({});
    });

    it('never drives a badge count below zero', () => {
        const doubled = [...normalizeTokenEvents(lifecycle),
            { seq: '6', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: -1 } as GameEvent];
        expect(p1(fold(doubled)).cards[0].statusTokens).toEqual({});
    });

    it('takes the host from attachedTo when the emitter carries it', () => {
        // forceteki now names the host on the token's own MOVE, so the binding no longer has
        // to be inferred from which STATUS_TOKEN happens to come next.
        const events: GameEvent[] = [
            { seq: '1', t: 'PLAY', card: 'ASH#220', zone: 'ground', p: 1 },
            { seq: '2', t: 'MOVE', card: 'TOKEN:Advantage', from: 'outsideTheGame', to: 'ground', p: 1, attachedTo: 'ASH#220' },
            { seq: '3', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: 1 },
            { seq: '4', t: 'MOVE', card: 'TOKEN:Advantage', from: 'ground', to: 'outsideTheGame', p: 1, attachedTo: 'ASH#220' },
        ];
        expect(normalizeTokenEvents(events)[3]).toEqual(
            { seq: '4', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: -1 },
        );
        expect(p1(fold(normalizeTokenEvents(events))).cards[0].statusTokens).toEqual({});
    });

    it('keeps other tokens on the host when one of several is removed', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'PLAY', card: 'ASH#220', zone: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: 1 });
        s = reduce(s, { seq: '3', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'weakness', count: 2 });
        s = reduce(s, { seq: '4', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: -1 });
        expect(p1(s).cards[0].statusTokens).toEqual({ weakness: 2 });
    });

    it('clamps experience at zero the way the reference fold does', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'PLAY', card: 'ASH#220', zone: 'ground', p: 1 });
        s = reduce(s, { seq: '2', t: 'EXPERIENCE_GAIN', card: 'ASH#220', count: 1 });
        s = reduce(s, { seq: '3', t: 'EXPERIENCE_GAIN', card: 'ASH#220', count: -3 });
        expect(p1(s).cards[0].experience).toBe(0);
    });

    it('tracks The Force on and off its player base', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'TOKEN:The Force', from: 'outsideTheGame', to: 'base', p: 2 });
        expect(s.players[2]!.hasForce).toBe(true);
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'TOKEN:The Force', from: 'base', to: 'outsideTheGame', p: 2 });
        expect(s.players[2]!.hasForce).toBe(false);
    });

    it('counts Credit tokens on and off a player base', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'TOKEN:credit#8015500527', from: 'outsideTheGame', to: 'base', p: 2 });
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'TOKEN:credit#8015500527:2', from: 'outsideTheGame', to: 'base', p: 2 });
        expect(s.players[2]!.credits).toBe(2);
        s = reduce(s, { seq: '3', t: 'MOVE', card: 'TOKEN:credit#8015500527', from: 'base', to: 'outsideTheGame', p: 2 });
        s = reduce(s, { seq: '4', t: 'DEFEAT', card: 'TOKEN:credit#8015500527', reason: 'ability' });
        expect(s.players[2]!.credits).toBe(1);
        expect(s.players[2]!.cards).toHaveLength(0);
        s = reduce(s, { seq: '5', t: 'MOVE', card: 'TOKEN:credit#8015500527:2', from: 'base', to: 'outsideTheGame', p: 2 });
        s = reduce(s, { seq: '6', t: 'MOVE', card: 'TOKEN:credit#8015500527:2', from: 'base', to: 'outsideTheGame', p: 2 });
        expect(s.players[2]!.credits).toBe(0);
    });
});

describe('normalizeTokenEvents — a fixed emitter is left alone', () => {
    it('does not double-remove when the stream already decrements the host', () => {
        const events: GameEvent[] = [
            { seq: '1', t: 'PLAY', card: 'ASH#220', zone: 'ground', p: 1 },
            { seq: '2', t: 'MOVE', card: 'TOKEN:Advantage', from: 'outsideTheGame', to: 'ground', p: 1 },
            { seq: '3', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: 2 },
            { seq: '4', t: 'MOVE', card: 'TOKEN:Advantage', from: 'ground', to: 'outsideTheGame', p: 1 },
            { seq: '5', t: 'STATUS_TOKEN', card: 'ASH#220', token: 'advantage', count: -1 },
        ];
        const fixed = normalizeTokenEvents(events);
        expect(fixed[3]).toEqual(events[3]); // the move is left as the inert event it is
        expect(p1(fold(fixed)).cards[0].statusTokens.advantage).toBe(1);
    });
});

describe('dropInertRecords', () => {
    // A deck search emits two junk MOVEs per card examined: `deck -> deck`, and a second
    // with an empty `from`. Neither is a zone transition; both cost the scrubber a frame.
    const search: GameEvent[] = [
        { seq: '1', t: 'SEARCH', p: 1 },
        { seq: '2', t: 'MOVE', card: 'JTL#096', from: 'deck', to: 'deck', p: 1 },
        { seq: '3', t: 'MOVE', card: 'JTL#096', from: '', to: 'deck', p: 1 },
        { seq: '4', t: 'MOVE', card: 'JTL#221', from: 'deck', to: 'space', p: 1 },
    ];

    it('drops same-zone and empty-endpoint moves, keeps real ones', () => {
        expect(dropInertRecords(search).map((e) => e.seq)).toEqual(['1', '4']);
    });

    it('keeps every non-MOVE record so seq lookups still resolve', () => {
        const kept = dropInertRecords(search).filter((e) => e.t !== 'MOVE');
        expect(kept).toEqual([search[0]]);
    });

    it('leaves a clean stream untouched', () => {
        const clean: GameEvent[] = [{ seq: '1', t: 'MOVE', card: 'A', from: 'deck', to: 'hand', p: 1 }];
        expect(dropInertRecords(clean)).toEqual(clean);
    });
});

describe('token upgrades vs token units', () => {
    // forceteki types Shield/Experience/Advantage/Weakness as ['token','upgrade'] — they
    // attach to a host and are not board cards — and Battle Droid/X-Wing/etc. as
    // ['token','unit'], which ARE board cards. Ignoring every TOKEN: id alike would strand
    // a defeated token unit in its arena for the rest of the replay.
    it('lets `kind` decide, whatever the id looks like', () => {
        // A current file states kind on MOVE/CREATE_TOKEN and in %%% CARDS, derived from the
        // card's type — so a token upgrade printed next year classifies itself.
        expect(isStatusTokenCard('TOKEN:something-new#123', 'upgrade')).toBe(true);
        expect(isStatusTokenCard('TOKEN:advantage#5844562972', 'unit')).toBe(false);
        expect(isStatusTokenCard('SOR#095', 'upgrade')).toBe(false); // not a token at all
    });

    it('falls back to the name list only for pre-1.0 files that state no kind', () => {
        for (const id of ['TOKEN:Advantage', 'TOKEN:Advantage:3', 'TOKEN:advantage#5844562972',
            'TOKEN:Shield', 'TOKEN:weakness']) {
            expect(isStatusTokenCard(id)).toBe(true);
        }
        for (const id of ['TOKEN:X-Wing', 'TOKEN:x-wing#9415311381', 'TOKEN:The Force',
            'TOKEN:the force#4571900905', 'ASH#220']) {
            expect(isStatusTokenCard(id)).toBe(false);
        }
    });

    it('reads the art id out of a current-shape token id only', () => {
        expect(tokenArtId('TOKEN:advantage#5844562972')).toBe('5844562972');
        expect(tokenArtId('TOKEN:Advantage:2')).toBeUndefined();
        // forceteki now requires a numeric id, so a token whose card data carries a
        // placeholder emits a bare `TOKEN:weakness` rather than `TOKEN:weakness#weakness-id`.
        expect(tokenArtId('TOKEN:weakness')).toBeUndefined();
        expect(tokenArtId('TOKEN:weakness#weakness-id')).toBeUndefined();
    });

    it('folds a token unit into and out of its arena like any other card', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'CREATE_TOKEN', p: 1, token: 'TOKEN:X-Wing', zone: 'space' });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['TOKEN:X-Wing']);
        s = reduce(s, { seq: '2', t: 'MOVE', card: 'TOKEN:X-Wing', from: 'space', to: 'discard', p: 1 });
        expect(p1(s).cards).toEqual([]);
    });

    // Two X-Wings are two units, and the spec settles it in the id: a second copy is
    // `TOKEN:x-wing#<id>:2`, never a repeat of the first id. So placement stays idempotent
    // by id — a real stream emits CREATE_TOKEN *and* the MOVE that carries the same token
    // into its arena, and folding both must not leave two of it — while distinct copies
    // fold to distinct cards.
    it('gives each token copy its own card and never double-adds one', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'CREATE_TOKEN', p: 1, token: 'TOKEN:x-wing#94153', zone: 'space' });
        s = reduce(s, { seq: '2', t: 'CREATE_TOKEN', p: 1, token: 'TOKEN:x-wing#94153:2', zone: 'space' });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['TOKEN:x-wing#94153', 'TOKEN:x-wing#94153:2']);
        // The paired MOVE the engine emits for the same token is a re-placement, not a
        // third unit.
        s = reduce(s, { seq: '3', t: 'MOVE', card: 'TOKEN:x-wing#94153', from: 'outsideTheGame', to: 'space', p: 1, kind: 'unit' });
        expect(p1(s).cards).toHaveLength(2);
        // Defeating one copy leaves the other on the board.
        s = reduce(s, { seq: '4', t: 'MOVE', card: 'TOKEN:x-wing#94153', from: 'space', to: 'discard', p: 1, kind: 'unit' });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['TOKEN:x-wing#94153:2']);
    });

    it('still keeps a token upgrade out of the arena', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'TOKEN:Advantage', from: 'outsideTheGame', to: 'space', p: 1 });
        expect(p1(s).cards).toEqual([]);
    });
});

describe('folding a whole file leaves the board coherent', () => {
    // Keyframe snapping papers over fold bugs: a phantom arena card or a duplicated id is
    // wiped at the next round boundary. Folding with keyframes STRIPPED is what exposed the
    // PLAY_UPGRADE fallback putting an ordinary upgrade in an arena.
    const doc = parse(SAMPLE);
    const noKeyframes = doc.events.map((e) =>
        (e.t === 'ROUND_START' || e.t === 'ROUND_END') ? { ...e, keyframe: undefined } : e);

    it('puts no upgrade in either arena and never duplicates a card id', () => {
        for (const s of foldFrames(noKeyframes)) {
            for (const seat of [1, 2] as const) {
                const cards = s.players[seat]?.cards ?? [];
                const ids = cards.map((c) => c.id);
                expect(ids).toEqual([...new Set(ids)]);
                for (const c of cards) {
                    expect(['ground', 'space', 'groundArena', 'spaceArena']).toContain(c.zone);
                }
            }
        }
    });

    it('keeps hand contents deduped and never above the counted size', () => {
        // hand[] is what the board RENDERS, so a duplicate id is a duplicate React key.
        // It can legitimately sit BELOW handSize: this synthetic fixture draws `SOR#178`
        // twice under one id (the real emitter gives each copy a `:N` suffix), and counting
        // it twice while rendering it once is the correct trade.
        for (const s of foldFrames(noKeyframes)) {
            for (const seat of [1, 2] as const) {
                const ps = s.players[seat]!;
                expect(ps.hand).toEqual([...new Set(ps.hand)]);
                expect(ps.hand.length).toBeLessThanOrEqual(ps.handSize);
            }
        }
    });
});

describe('malformed input does not take the reader down', () => {
    // Fields come straight off JSON.parse of an uploaded file — parse.ts documents the
    // threat model ("a malformed or hostile file — replays are shared between users").
    // Nothing guarantees `card` is a string, and a token helper calling .startsWith on a
    // number threw `id.startsWith is not a function` out of BOTH entry points.
    const badCard = [
        { seq: 'R1.A.1', t: 'MOVE', card: 123, from: 'deck', to: 'hand', p: 1 },
        { seq: 'R1.A.2', t: 'MOVE', card: null, from: 'hand', to: 'ground', p: 1 },
    ] as unknown as GameEvent[];

    it('survives a non-string card id through normalize and fold', () => {
        expect(() => normalizeEvents(badCard)).not.toThrow();
        expect(() => foldFrames(badCard)).not.toThrow();
    });

    it('classifies a non-string id as not-a-token rather than throwing', () => {
        expect(isStatusTokenCard(123 as unknown as string)).toBe(false);
        expect(tokenArtId(null as unknown as string)).toBeUndefined();
    });
});

describe('hostile file cannot corrupt the page or the pile', () => {
    // Every field here comes off JSON.parse of a file users share with each other.
    it('a non-seat `p` never touches Object.prototype', () => {
        const ev = [{ seq: '1', t: 'MOVE', card: 'X', from: 'deck', to: 'resource', p: '__proto__' }] as unknown as GameEvent[];
        expect(() => fold(ev)).not.toThrow();
        // Was: Object.prototype.resourcesReady = NaN, set for the whole page session.
        expect(({} as Record<string, unknown>).resourcesReady).toBeUndefined();
    });

    it('skips a non-object event line instead of throwing', () => {
        const ev = [null, 5, 'x', { seq: '1', t: 'PASS', p: 1 }] as unknown as GameEvent[];
        expect(() => fold(ev)).not.toThrow();
    });

    it('tolerates a scalar where a card list is declared', () => {
        const ev = [
            { seq: '1', t: 'DRAW', p: 1, count: 1, cards: 3 },
            { seq: '2', t: 'DISCARD', p: 1, cards: null },
        ] as unknown as GameEvent[];
        expect(() => fold(ev)).not.toThrow();
        expect(p1(fold(ev)).hand).toEqual([]);
    });

    it('only seats 1 and 2 can own a base', () => {
        const ev = [
            { seq: '1', t: 'DAMAGE', src: 'X', tgt: 'base@7', amt: 1, damageType: 'combat', hp: 5 },
            { seq: '2', t: 'DAMAGE', src: 'X', tgt: 'base@0', amt: 1, damageType: 'combat', hp: 5 },
        ] as unknown as GameEvent[];
        // A phantom seat used to be created and then ride along in every frame clone.
        expect(Object.keys(fold(ev).players).sort()).toEqual(['1', '2']);
    });

    it('keeps the discard pile deduped and removes a card that leaves it', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'A', from: 'ground', to: 'discard', p: 1 });
        s = reduce(s, { seq: '2', t: 'DEFEAT', card: 'A', reason: 'ability' });
        expect(p1(s).discard).toEqual(['A']);
        s = reduce(s, { seq: '3', t: 'MOVE', card: 'A', from: 'discard', to: 'hand', p: 1 });
        expect(p1(s).discard).toEqual([]);
    });
});

describe('a keyframe off an untrusted file is coerced to the PlayerState shape', () => {
    const kf = (p1: Record<string, unknown>): ReducedState => ({
        round: 1, phase: 'action', initiative: 1,
        players: { 1: { seat: 1, hand: [], discard: [], cards: [], ...p1 }, 2: keyframe().players[2] },
    } as unknown as ReducedState);

    it('a card that omits upgrades/statusTokens survives its own arena exit and DEFEAT', () => {
        const start = { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf({ cards: [{ id: 'SOR#001', zone: 'ground' }] }) } as GameEvent;
        let s = fold([start, { seq: '2', t: 'EXPERIENCE_GAIN', card: 'SOR#001', count: 1 } as GameEvent]);
        expect(p1(s).cards[0].experience).toBe(1);
        expect(p1(s).cards[0].upgrades).toEqual([]);
        s = fold([start, { seq: '2', t: 'MOVE', card: 'SOR#001', from: 'ground', to: 'discard', p: 1 } as GameEvent]);
        expect(p1(s).cards).toHaveLength(0);
        s = fold([start, { seq: '2', t: 'DEFEAT', card: 'SOR#001' } as GameEvent]);
        expect(p1(s).cards).toHaveLength(0);
    });

    it('a seat with a non-array pile or a non-object card is a damaged checkpoint: ignored, folded seat kept (§13)', () => {
        const before = [{ seq: '1', t: 'MOVE', card: 'SOR#009', from: 'deck', to: 'hand', p: 1 }] as GameEvent[];
        for (const bad of [{ hand: 'nope' }, { discard: null }, { cards: 'x' }, { cards: [null] }, { cards: [7] }]) {
            const s = fold([...before, { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf(bad) } as GameEvent]);
            expect(p1(s).hand, JSON.stringify(bad)).toEqual(['SOR#009']);
            expect(s.players[2]!.baseHp).toBe(30); // the complete seat still snapped
        }
    });

    it('non-numeric scalars on a complete seat fall back instead of throwing on the next event', () => {
        const start = { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf({ credits: '3', baseHp: 'x', handSize: null, cards: [{ id: 'SOR#001', zone: 'ground', damage: 'lots', upgrades: 'no', captured: 5 }] }) } as GameEvent;
        const s = fold([start,
            { seq: '2', t: 'MOVE', card: 'SOR#009', from: 'deck', to: 'hand', p: 1 },
            { seq: '3', t: 'MOVE', card: 'TOKEN:credit#1', from: 'outsideTheGame', to: 'base', p: 1 },
        ] as GameEvent[]);
        expect(p1(s).hand).toEqual(['SOR#009']);
        expect(p1(s).handSize).toBe(1);
        expect(p1(s).credits).toBe(1);
        expect(p1(s).baseHp).toBe(30);
        expect(p1(s).cards).toEqual([{ id: 'SOR#001', zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [] }]);
    });

    it('carries baseUpgrades, baseCaptured and baseDefeated only when well-typed', () => {
        const snap = (over: Record<string, unknown>) => p1(fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf(over) }] as unknown as GameEvent[]));
        expect(snap({ baseUpgrades: ['HMW#147', 7], baseCaptured: ['LAW#253:3'], baseDefeated: true })).toMatchObject({ baseUpgrades: ['HMW#147', '7'], baseCaptured: ['LAW#253:3'], baseDefeated: true });
        const bad = snap({ baseUpgrades: 'HMW#147', baseCaptured: { 0: 'x' }, baseDefeated: 'yes' });
        expect(bad.baseUpgrades).toBeUndefined();
        expect(bad.baseCaptured).toBeUndefined();
        expect(bad.baseDefeated).toBeUndefined();
    });

    it('ignores a keyframe whose lists no real game can reach (§13: a damaged checkpoint)', () => {
        const big = Array.from({ length: 5000 }, (_, i) => `X#${i}`);
        for (const field of ['hand', 'discard', 'baseUpgrades', 'baseCaptured', 'resources']) {
            const s = fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf({ handSize: 7, [field]: big }) }] as unknown as GameEvent[]);
            expect(p1(s).handSize, field).toBe(0);
        }
    });

    it('caps every keyframe list, so one line cannot make every frame clone 1000 strings', () => {
        const big = Array.from({ length: 900 }, (_, i) => `X#${i}`);
        const ups = Array.from({ length: 900 }, (_, i) => `U#${i}`);
        const s = fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf({ hand: big, discard: big, cards: big.map((id) => ({ id, zone: 'ground', upgrades: ups })) }) }] as unknown as GameEvent[]);
        expect(p1(s).hand.length).toBe(200);
        expect(p1(s).discard.length).toBe(200);
        expect(p1(s).cards.length).toBe(200);
        expect(p1(s).cards[0].upgrades.length).toBe(200);
    });

    it('caps every zone list, so one DRAW cannot hang the tab scanning it', () => {
        // `addOnce` scans the list, so an unbounded one is quadratic: 200k unique ids is ~2e10
        // string comparisons. Past the cap the id is dropped, not the file refused — degrading
        // is the fold's contract, and no honest file comes near 1000.
        const big = Array.from({ length: 3000 }, (_, i) => `X#${i}`);
        const s = fold([{ seq: 'R1.A.1', t: 'DRAW', p: 1, count: big.length, cards: big },
            { seq: 'R1.A.2', t: 'DISCARD', p: 1, cards: big }] as unknown as GameEvent[]);
        expect(p1(s).hand.length).toBe(1000);
        expect(p1(s).discard.length).toBe(1000);
        // And the cards it did keep are the real ones, in order.
        expect(p1(s).hand[0]).toBe('X#0');
        expect(p1(s).hand[999]).toBe('X#999');
    });

    it('a keyframe that is not an object is ignored entirely', () => {
        const s = fold([{ seq: '1', t: 'MOVE', card: 'SOR#009', from: 'deck', to: 'hand', p: 1 },
            { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: 5 }] as unknown as GameEvent[]);
        expect(p1(s).hand).toEqual(['SOR#009']);
    });

    it('a seat that is not an object is ignored and the folded seat kept', () => {
        const s = fold([{ seq: '1', t: 'MOVE', card: 'SOR#009', from: 'deck', to: 'hand', p: 1 },
            { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: 'garbage', 2: keyframe().players[2] } } }] as unknown as GameEvent[]);
        expect(p1(s).hand).toEqual(['SOR#009']);
    });
});

describe('keyframes do not smuggle token upgrades onto the board', () => {
    // The 1.0 writer lists a token UPGRADE in the keyframe's `cards[]` as though it were a
    // unit — the same token it also records on its host's statusTokens. MOVE events state
    // `kind: 'upgrade'` and are filtered, but a keyframe is snapped in wholesale, so the
    // pseudo-card landed in an arena and rendered as "IMAGE NOT FOUND" on the board.
    const kf = (): ReducedState => ({
        round: 1, phase: 'action', initiative: 1,
        players: {
            1: { seat: 1, baseHp: 33, baseMaxHp: 33, handSize: 0, hand: [], resourcesReady: 0,
                resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [
                    { id: 'LOF#192', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: { advantage: 1 }, captured: [] },
                    { id: 'TOKEN:advantage#5844562972', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [] },
                    { id: 'TOKEN:shield#8752877738', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [] },
                ] },
            2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
                resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
        },
    });

    it('drops token upgrades from a snapped keyframe, keeping the host and its counters', () => {
        const s = fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf() }] as GameEvent[]);
        expect(p1(s).cards.map((c) => c.id)).toEqual(['LOF#192']);
        expect(p1(s).cards[0].statusTokens).toEqual({ advantage: 1 });
    });
});

describe('dropInertRecords never orphans an anchored record', () => {
    const inert: GameEvent[] = [
        { seq: 'a', t: 'MOVE', card: 'X', from: 'deck', to: 'deck', p: 1 },
        { seq: 'b', t: 'MOVE', card: 'Y', from: 'deck', to: 'deck', p: 1 },
    ];

    it('keeps a record an annotation points at', () => {
        expect(dropInertRecords(inert, new Set(['b'])).map((e) => e.seq)).toEqual(['b']);
    });

    it('never empties a non-empty stream — an all-inert file must not render zero frames', () => {
        expect(normalizeEvents(inert)).toHaveLength(inert.length);
    });
});

describe('upgrades attach via the MOVE\'s attachedTo and come off when they leave play', () => {
    // Records shaped like the upstream `upgrades` and `pilot` vectors (swupgn/test-vectors): a printed
    // upgrade (Ascension Cable, LOF#215) on a Wampa (LOF#164), and a pilot (Academy Graduate,
    // JTL#058) flown onto an X-Wing (LAW#253). The token upgrades that ride alongside in the
    // real stream are covered by the token tests above.
    const wampaOut = (): ReducedState => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'LOF#164', from: 'hand', to: 'ground', p: 1, kind: 'unit' });
        return s;
    };

    it('attaches from the MOVE alone, and the PLAY_UPGRADE that follows does not attach it twice', () => {
        let s = wampaOut();
        s = reduce(s, { seq: 'R1.A.2b', t: 'MOVE', card: 'LOF#215', from: 'hand', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'LOF#164' });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['LOF#164']);
        expect(p1(s).cards[0].upgrades).toEqual(['LOF#215']);
        s = reduce(s, { seq: 'R1.A.2', t: 'PLAY_UPGRADE', p: 1, card: 'LOF#215', zone: 'ground', target: 'LOF#164', cost: 2 });
        expect(p1(s).cards[0].upgrades).toEqual(['LOF#215']);
        // The upgrade left the hand like any card, and never became an arena card.
        expect(p1(s).handSize).toBe(0);
        expect(p1(s).cards).toHaveLength(1);
    });

    it('a defeated printed upgrade leaves its host on the exit MOVE and lands in the discard', () => {
        let s = wampaOut();
        s = reduce(s, { seq: 'a', t: 'MOVE', card: 'LOF#215', from: 'hand', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'LOF#164' });
        // The writer states no host on the way out; the id is enough.
        s = reduce(s, { seq: 'R1.A.5b', t: 'MOVE', card: 'LOF#215', from: 'ground', to: 'discard', p: 1, kind: 'upgrade' });
        s = reduce(s, { seq: 'R1.A.5c', t: 'DEFEAT', card: 'LOF#215', reason: 'frameworkEffect' });
        expect(p1(s).cards[0].upgrades).toEqual([]);
        expect(p1(s).discard).toEqual(['LOF#215']);
        expect(p1(s).cards.map((c) => c.id)).toEqual(['LOF#164']);
    });

    it('a pilot whose vehicle is destroyed stops flying it, even though its exit MOVE says kind: unit', () => {
        let s = base();
        s = reduce(s, { seq: '1', t: 'MOVE', card: 'LAW#253', from: 'hand', to: 'space', p: 1, kind: 'unit' });
        s = reduce(s, { seq: 'R1.A.0ci', t: 'MOVE', card: 'JTL#058', from: 'hand', to: 'space', p: 1, kind: 'upgrade', attachedTo: 'LAW#253' });
        s = reduce(s, { seq: 'R1.A.1', t: 'PLAY_UPGRADE', p: 1, card: 'JTL#058', zone: 'space', target: 'LAW#253', cost: 1 });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['LAW#253']);
        expect(p1(s).cards[0].upgrades).toEqual(['JTL#058']);
        // Verbatim from pilot.swupgn: the pilot's exit is recorded as a unit move with no host.
        s = reduce(s, { seq: 'R1.A.3b', t: 'MOVE', card: 'JTL#058', from: 'space', to: 'discard', p: 1, kind: 'unit' });
        s = reduce(s, { seq: 'R1.A.3c', t: 'DEFEAT', card: 'JTL#058', reason: 'frameworkEffect' });
        expect(p1(s).cards[0].upgrades).toEqual([]);
        expect(p1(s).discard).toEqual(['JTL#058']);
        // The pilot never got its own arena slot on the way out either.
        expect(p1(s).cards).toHaveLength(1);
        s = reduce(s, { seq: 'R1.A.3d', t: 'MOVE', card: 'LAW#253', from: 'space', to: 'discard', p: 1, kind: 'unit' });
        s = reduce(s, { seq: 'R1.A.3e', t: 'DEFEAT', card: 'LAW#253', reason: 'ability' });
        expect(p1(s).cards).toEqual([]);
        expect(p1(s).discard).toEqual(['JTL#058', 'LAW#253']);
    });

    it('a pre-1.0 file with only a DEFEAT still takes the upgrade off its host', () => {
        let s = wampaOut();
        s = reduce(s, { seq: 'p', t: 'PLAY_UPGRADE', p: 1, card: 'LOF#215', target: 'LOF#164' });
        expect(p1(s).cards[0].upgrades).toEqual(['LOF#215']);
        s = reduce(s, { seq: 'd', t: 'DEFEAT', card: 'LOF#215', reason: 'ability' });
        expect(p1(s).cards[0].upgrades).toEqual([]);
    });

    it('treats a MOVE that names a host but states no kind as an attachment (spec §22.1)', () => {
        let s = wampaOut();
        s = reduce(s, { seq: 'x', t: 'MOVE', card: 'SEC#038', from: 'hand', to: 'ground', p: 1, attachedTo: 'LOF#164' });
        expect(p1(s).cards.map((c) => c.id)).toEqual(['LOF#164']);
        expect(p1(s).cards[0].upgrades).toEqual(['SEC#038']);
    });

    it('a MOVE to a host the fold does not track attaches nothing and places nothing', () => {
        let s = base();
        s = reduce(s, { seq: 'x', t: 'MOVE', card: 'LOF#215', from: 'hand', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'NOPE#001' });
        expect(p1(s).cards).toEqual([]);
    });

    it('reproduces the fixed writer\'s own files: no upgrade is ever an arena card, and none outlives its exit', () => {
        for (const name of ['upgrades', 'pilot'] as const) {
            const text = readFileSync(path.join(__dirname, `fixtures/vectors/${name}.swupgn`), 'utf-8');
            const doc = parse(text);
            const events = normalizeEvents(doc.events);
            const frames = foldFrames(events);
            const upgradeIds = new Set(events.flatMap((e) => (e.t === 'PLAY_UPGRADE' ? [e.card] : [])));
            expect(upgradeIds.size).toBeGreaterThan(0);
            for (let i = 0; i < frames.length; i++) {
                const arena = ([1, 2] as const).flatMap((seat) => frames[i].players[seat]?.cards ?? []);
                for (const c of arena) expect(upgradeIds.has(c.id), `${name} frame ${i} (${events[i].seq})`).toBe(false);
            }
            // After the last record that moves an upgrade out of an arena, no host carries it;
            // one still attached when the game ends is on a host in the final frame.
            for (const id of upgradeIds) {
                const exit = events.map((e, i) => ({ e, i })).filter(({ e }) => e.t === 'MOVE' && e.card === id && ARENA.has(e.from) && !ARENA.has(e.to)).pop();
                if (!exit) {
                    const last = ([1, 2] as const).flatMap((seat) => frames[frames.length - 1].players[seat]?.cards ?? []);
                    expect(last.some((c) => c.upgrades.includes(id)), `${name}: ${id} neither left play nor stayed attached`).toBe(true);
                    continue;
                }
                const after = ([1, 2] as const).flatMap((seat) => frames[exit!.i].players[seat]?.cards ?? []);
                for (const c of after) expect(c.upgrades, `${name} after ${events[exit!.i].seq}`).not.toContain(id);
            }
            // And the keyframe gate stays silent about arena membership on both files.
            expect(checkKeyframes(doc.events).mismatches.filter((m) => m.path.includes('cards['))).toEqual([]);
        }
    });
});

const ARENA = new Set(['ground', 'space']);

describe('upgrades attach to their host instead of standing in an arena', () => {
    // A PILOT is the sharp case: `kind` describes the card's PRINTED type, not the role it
    // is taking, so Han Solo (a ground unit played as an upgrade onto a vehicle) arrives as
    // `MOVE ... to: "space", kind: "unit"` and stood in the SPACE arena as a standalone
    // ground unit. PLAY_UPGRADE carries no target either — but the keyframes record
    // `upgrades: ["JTL#203"]` on the host, so the binding is recoverable.
    const pilotPlay: GameEvent[] = [
        { seq: 'R3.A.0a', t: 'PLAY', p: 1, card: 'JTL#221', zone: 'space' },
        { seq: 'R3.A.0b', t: 'MOVE', card: 'JTL#203', from: 'hand', to: 'space', p: 1, kind: 'unit' },
        { seq: 'R3.A.1', t: 'PLAY_UPGRADE', p: 1, card: 'JTL#203', zone: 'space', cost: 5 },
        { seq: 'R3.end', t: 'ROUND_END', round: 3, keyframe: {
            round: 3, phase: 'action', initiative: 1,
            players: {
                1: { seat: 1, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
                    resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [
                        { id: 'JTL#221', zone: 'space', damage: 0, exhausted: false, upgrades: ['JTL#203'], shields: 0, experience: 0, statusTokens: {}, captured: [] },
                        { id: 'JTL#203', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [] },
                    ] },
                2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
                    resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
            },
        } },
    ];

    it('recovers the missing target from the keyframe and attaches at play time', () => {
        const s = fold(normalizeEvents(pilotPlay).slice(0, 3));
        expect(p1(s).cards.map((c) => c.id)).toEqual(['JTL#221']);
        expect(p1(s).cards[0].upgrades).toEqual(['JTL#203']);
    });

    it('still recovers the binding with an inert record between the MOVE and its PLAY_UPGRADE', () => {
        const ev: GameEvent[] = [pilotPlay[0], pilotPlay[1],
            { seq: 'R3.A.0c', t: 'MOVE', card: 'X', from: 'hand', to: 'hand', p: 1 },
            pilotPlay[2], pilotPlay[3]];
        const s = fold(normalizeEvents(ev).slice(0, 3));
        expect(p1(s).cards.map((c) => c.id)).toEqual(['JTL#221']);
        expect(p1(s).cards[0].upgrades).toEqual(['JTL#203']);
    });

    it('a same-arena MOVE naming a new host moves the upgrade over', () => {
        const ev: GameEvent[] = [
            { seq: '1', t: 'MOVE', card: 'H1', from: 'hand', to: 'ground', p: 1, kind: 'unit' },
            { seq: '2', t: 'MOVE', card: 'H2', from: 'hand', to: 'ground', p: 1, kind: 'unit' },
            { seq: '3', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'H1' },
            { seq: '4', t: 'MOVE', card: 'U', from: 'ground', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'H2' },
        ];
        const s = fold(normalizeEvents(ev));
        expect(Object.fromEntries(p1(s).cards.map((c) => [c.id, c.upgrades]))).toEqual({ H1: [], H2: ['U'] });
    });

    it('never lists an attached card as its own arena card after a keyframe snap', () => {
        const s = fold(normalizeEvents(pilotPlay));
        expect(p1(s).cards.map((c) => c.id)).toEqual(['JTL#221']);
        expect(p1(s).cards[0].upgrades).toEqual(['JTL#203']);
    });

    it('leaves an already-targeted PLAY_UPGRADE alone', () => {
        const ev: GameEvent[] = [
            { seq: '1', t: 'PLAY', p: 1, card: 'HOST', zone: 'ground' },
            { seq: '2', t: 'PLAY_UPGRADE', p: 1, card: 'UPG', target: 'HOST' },
        ];
        expect(repairUpgradePlays(ev)).toEqual(ev);
    });
});

describe('a keyframe cannot smuggle a bad shape into the new §11 fields', () => {
    const kf = (over: Record<string, unknown>): ReducedState => ({
        round: 1, phase: 'action', initiative: 1,
        players: { 1: { seat: 1, hand: [], discard: [], cards: [], ...over }, 2: keyframe().players[2] },
    } as unknown as ReducedState);

    it('coerces resources, baseEpicActionUsed and onStartingSide, and keeps absent absent', () => {
        const snap = (over: Record<string, unknown>) => fold([{
            seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: kf(over),
        }] as unknown as GameEvent[]);
        // A non-array `resources` is a list the fold scans on every resource MOVE.
        expect(snap({ resources: 'evil' }).players[1]!.resources).toBeUndefined();
        expect(snap({ resources: Array.from({ length: 900 }, (_, i) => `R#${i}`) }).players[1]!.resources!.length).toBe(200);
        expect(snap({ baseEpicActionUsed: 'yes' }).players[1]!.baseEpicActionUsed).toBeUndefined();
        expect(snap({ baseEpicActionUsed: true }).players[1]!.baseEpicActionUsed).toBe(true);
        // Absent is never "back side": only a double-sided leader carries a face at all.
        expect(snap({ leader: { id: 'SOR#010', deployed: false, exhausted: false, epicActionUsed: false } })
            .players[1]!.leader!.onStartingSide).toBeUndefined();
        expect(snap({ leader: { id: 'TWI#017', deployed: false, exhausted: false, epicActionUsed: false, onStartingSide: false } })
            .players[1]!.leader!.onStartingSide).toBe(false);
        // `active` is indexed as players[active] by a reader: never written from a non-seat.
        expect(fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { ...kf({}), active: '__proto__' } }] as unknown as GameEvent[]).active).toBeUndefined();
        expect(fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { ...kf({}), active: 2 } }] as unknown as GameEvent[]).active).toBe(2);
    });
});

describe('Homeworlds review gaps: arena moves, base releases, leaders coming home', () => {
    const mv = (seq: string, card: string, from: string, to: string, extra: object = {}) =>
        ({ seq, t: 'MOVE', card, from, to, p: 1, ...extra }) as GameEvent;

    // Value: protects=an ejected pilot stops being its vehicle's upgrade; fails_when=fold drops the detach on a unit arriving in an arena; why_new=no vector moves a pilot space->ground; seam=none; no_claim=keyframe gating
    it('a pilot ejected space -> ground is a ground unit and no longer on its vehicle', () => {
        const s = fold([
            mv('1', 'V', 'hand', 'space', { kind: 'unit' }),
            mv('2', 'P', 'hand', 'space', { kind: 'upgrade', attachedTo: 'V' }),
            mv('3', 'P', 'space', 'ground', { kind: 'unit' }),
        ]);
        expect(p1(s).cards.find((c) => c.id === 'V')!.upgrades).toEqual([]);
        expect(p1(s).cards.find((c) => c.id === 'P')?.zone).toBe('ground');
    });

    // Value: protects=a unit attached as a pilot leaves cards[]; fails_when=removeFromArenas on an attaching MOVE is dropped; why_new=the same-arena host test never starts from a standing unit; seam=none; no_claim=render
    it('a unit standing in an arena that is attached as a pilot stops being an arena card', () => {
        const s = fold([
            mv('1', 'HOST', 'hand', 'space', { kind: 'unit' }),
            mv('2', 'X', 'hand', 'ground', { kind: 'unit' }),
            mv('3', 'X', 'ground', 'space', { kind: 'upgrade', attachedTo: 'HOST' }),
        ]);
        expect(p1(s).cards.map((c) => c.id)).toEqual(['HOST']);
        expect(p1(s).cards[0].upgrades).toEqual(['X']);
    });

    // Value: protects=a crafted file of unique arena MOVEs/PLAYs cannot fold in O(n^2); fails_when=either MAX_ZONE_LIST arena guard is removed; why_new=only hand/discard/keyframe caps were tested; seam=none; no_claim=wall-clock timing
    it('caps the arena on both the MOVE and the PLAY path', () => {
        const moves = Array.from({ length: 3000 }, (_, i) => mv(`R1.A.${i}`, `X#${i}`, 'hand', 'ground'));
        expect(p1(fold(moves)).cards.length).toBe(1000);
        const plays = Array.from({ length: 3000 }, (_, i) => ({ seq: `R1.A.${i}`, t: 'PLAY', p: 1, card: `Y#${i}`, zone: 'ground' }) as GameEvent);
        expect(p1(fold(plays)).cards.length).toBe(1000);
    });

    // Value: protects=a leader MOVE arena->base undeploys it (the side-aware names rely on it); fails_when=the leader's MOVE home stops clearing deployed; why_new=no vector has a leader come home; seam=none; no_claim=render's own side tracking
    it('a deployed leader coming home is undeployed and off the arena', () => {
        const s = fold([
            { seq: '1', t: 'DEPLOY_LEADER', p: 1, card: 'HMW#004', zone: 'space' } as GameEvent,
            mv('2', 'HMW#004', 'space', 'base', { kind: 'unit' }),
        ]);
        expect(p1(s).leader!.deployed).toBe(false);
        expect(p1(s).cards.find((c) => c.id === 'HMW#004')).toBeUndefined();
    });

    // Value: protects=a DEFEAT alone takes a Fortify upgrade off its base and a captive off a base; fails_when=detachFromBases or the baseCaptured detach in DEFEAT is dropped; why_new=the vectors always pair DEFEAT with a MOVE that already detached; seam=none; no_claim=none beyond protects
    it('a DEFEAT with no MOVE releases a Fortify upgrade and a base captive', () => {
        const s = fold([
            mv('1', 'HMW#147', 'hand', 'base', { kind: 'upgrade', attachedTo: 'base@1' }),
            { seq: '2', t: 'CAPTURE', p: 1, card: 'LAW#253:3', by: 'base@1' } as GameEvent,
            { seq: '3', t: 'DEFEAT', card: 'HMW#147', reason: 'ability' } as GameEvent,
            { seq: '4', t: 'DEFEAT', card: 'LAW#253:3', reason: 'ability' } as GameEvent,
        ]);
        expect(p1(s).baseUpgrades).toEqual([]);
        expect(p1(s).baseCaptured).toEqual([]);
    });
});

describe('pass-2 review gaps: mirror leaders, keyframe snaps of leader and base state', () => {
    // Value: protects=a mirror match's leaders move independently in the fold; fails_when=leader lookup matches by baseId instead of the exact id; why_new=the mirror resolver test builds its state by hand; seam=none; no_claim=render's story
    it('deploying and bringing home one mirror leader leaves the other seat alone', () => {
        const s = fold([
            { seq: '1', t: 'DEPLOY_LEADER', p: 1, card: 'HMW#004', zone: 'space' },
            { seq: '2', t: 'DEPLOY_LEADER', p: 2, card: 'HMW#004:2', zone: 'space' },
            { seq: '3', t: 'MOVE', card: 'HMW#004', from: 'space', to: 'base', p: 1, kind: 'unit' },
            { seq: '4', t: 'LEADER_FLIP', p: 2, card: 'HMW#004:2', onStartingSide: true },
        ] as GameEvent[]);
        expect(p1(s).leader!.deployed).toBe(false);
        expect(s.players[2]!.leader!.deployed).toBe(true);
        expect(p1(s).leader!.onStartingSide).toBeUndefined();
    });

    // Value: protects=a keyframe keeps each mirror leader's own id and coerces deployed to a boolean; fails_when=normalizeLeader strips the copy suffix or keeps a non-boolean deployed; why_new=the exact-id resolver depends on both; seam=none; no_claim=none beyond protects
    it('snaps mirror leader ids verbatim and deployed as a boolean', () => {
        const leader = (id: string, deployed: unknown) => ({ id, deployed, exhausted: false, epicActionUsed: false });
        const ks = (p2: object) => fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: {
            round: 1, phase: 'action', initiative: 1,
            players: { 1: { seat: 1, hand: [], discard: [], cards: [], leader: leader('TWI#017', true) }, 2: { seat: 2, hand: [], discard: [], cards: [], ...p2 } },
        } }] as unknown as GameEvent[]);
        const s = ks({ leader: leader('TWI#017:2', 'yes') });
        expect(p1(s).leader).toMatchObject({ id: 'TWI#017', deployed: true });
        expect(s.players[2]!.leader).toMatchObject({ id: 'TWI#017:2', deployed: false });
    });

    // Value: protects=a pilot file's Fortify upgrades survive a keyframe that does not state baseUpgrades; fails_when=snapToKeyframe clears an unstated baseUpgrades; why_new=every Fortify vector also carries keyframe baseUpgrades; seam=none; no_claim=the integrity gate (it skips unstated fields)
    it('keeps fold-tracked base holdings across a keyframe that does not state them', () => {
        const kf = { round: 2, phase: 'action', initiative: 1, players: {
            1: { seat: 1, hand: [], discard: [], cards: [] }, 2: { seat: 2, hand: [], discard: [], cards: [] } } };
        const s = fold([
            { seq: '1', t: 'MOVE', card: 'HMW#147', from: 'hand', to: 'base', p: 1, kind: 'upgrade' },
            { seq: '2', t: 'CAPTURE', p: 1, card: 'LAW#253:3', by: 'base@1' },
            { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: kf },
        ] as unknown as GameEvent[]);
        expect(p1(s).baseUpgrades).toEqual(['HMW#147']);
        expect(p1(s).baseCaptured).toEqual(['LAW#253:3']);
        // A keyframe that does state them wins.
        const stated = fold([
            { seq: '1', t: 'MOVE', card: 'HMW#147', from: 'hand', to: 'base', p: 1, kind: 'upgrade' },
            { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: { ...kf, players: { ...kf.players, 1: { ...kf.players[1], baseUpgrades: [] } } } },
        ] as unknown as GameEvent[]);
        expect(p1(stated).baseUpgrades).toEqual([]);
    });
});

describe('pass-3 review gaps: carried base holdings, stateAt, a defeated base', () => {
    const kf = (round: number, p1: object = {}) => ({ round, phase: 'action', initiative: 1, players: {
        1: { seat: 1, hand: [], discard: [], cards: [], ...p1 }, 2: { seat: 2, hand: [], discard: [], cards: [] } } });
    const pilotStream = [
        { seq: 'R1.A.1', t: 'MOVE', card: 'HMW#147', from: 'hand', to: 'base', p: 1, kind: 'upgrade' },
        { seq: 'R1.A.2', t: 'CAPTURE', p: 1, card: 'LAW#253:3', by: 'base@1' },
        { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: kf(2) },
        { seq: 'R2.A.1', t: 'MOVE', card: 'HMW#147', from: 'base', to: 'discard', p: 1 },
        { seq: 'R2.A.2', t: 'MOVE', card: 'LAW#253:3', from: 'capture', to: 'ground', p: 2, kind: 'unit' },
        { seq: 'R2.A.3', t: 'RESCUE', p: 2, card: 'LAW#253:3' },
    ] as unknown as GameEvent[];

    // Value: protects=stateAt reaches the same board as fold/foldFrames on a file whose keyframes omit base holdings; fails_when=stateAt restarts from a keyframe that does not state them; why_new=the carry-over made the two entry points disagree; seam=none; no_claim=performance of the restart
    it('stateAt agrees with foldFrames at every record of a pilot-shaped stream', () => {
        const frames = foldFrames(pilotStream);
        pilotStream.forEach((e, i) => expect(stateAt(pilotStream, e.seq), e.seq).toEqual(frames[i]));
    });

    // Value: protects=carried holdings still leave on a MOVE out of base / out of capture, and earlier frames keep them; fails_when=the carried list aliases the prior frame or a release stops clearing it; why_new=the carry test ended at the keyframe; seam=none; no_claim=keyframe gating
    it('releases carried holdings without touching earlier frames', () => {
        const frames = foldFrames(pilotStream);
        expect(frames[2].players[1]!.baseUpgrades).toEqual(['HMW#147']);
        expect(frames[2].players[1]!.baseCaptured).toEqual(['LAW#253:3']);
        expect(frames[5].players[1]!.baseUpgrades).toEqual([]);
        expect(frames[5].players[1]!.baseCaptured).toEqual([]);
        expect(frames[5].players[2]!.cards.map((c) => c.id)).toContain('LAW#253:3');
    });

    // Value: protects=a base defeated by its DEFEAT record stays defeated across a keyframe that does not restate it; fails_when=snapToKeyframe drops a prior baseDefeated; why_new=only keyframes that state it were tested; seam=none; no_claim=the integrity gate's own comparison
    it('keeps a base defeated across a keyframe that does not restate it', () => {
        const s = fold([
            { seq: 'R1.A.1', t: 'DEFEAT', card: 'base@2', reason: 'ability' },
            { seq: 'R1.end', t: 'ROUND_END', round: 1, keyframe: kf(1) },
        ] as unknown as GameEvent[]);
        expect(s.players[2]!.baseDefeated).toBe(true);
    });
});

describe('audit gaps: what attaches to a base, and to which one', () => {
    // Value: protects=a PLAY_UPGRADE naming base@N puts a Fortify upgrade on that seat's base; fails_when=the base branch reverts to attachTo(), which finds no card for base@N; why_new=every Fortify fixture pairs the PLAY with a MOVE that already attached; seam=none; no_claim=keyframe snaps
    it('a PLAY_UPGRADE onto base@N with no MOVE beside it attaches to that base', () => {
        const s = fold([{ seq: 'R1.A.1', t: 'PLAY_UPGRADE', p: 1, card: 'HMW#147', zone: 'base', target: 'base@1', cost: 2 } as GameEvent]);
        expect(p1(s).baseUpgrades).toEqual(['HMW#147']);
        expect(s.players[2]?.baseUpgrades).toBeUndefined();
        expect(p1(s).cards).toEqual([]);
    });

    // Value: protects=a MOVE's attachedTo base@N, not its p, picks the base; and a token is never a base upgrade; fails_when=seat falls back to e.p first, or the isTokenId guard is dropped; why_new=fixtures only attach to the mover's own base; seam=none; no_claim=credit/Force counting
    it('attaches to the base attachedTo names, and never attaches a token', () => {
        const s = fold([
            { seq: '1', t: 'MOVE', card: 'HMW#147', from: 'hand', to: 'base', p: 1, kind: 'upgrade', attachedTo: 'base@2' },
            { seq: '2', t: 'MOVE', card: 'TOKEN:credit#1', from: 'outsideTheGame', to: 'base', p: 1, kind: 'upgrade', attachedTo: 'base@1' },
        ] as GameEvent[]);
        expect(s.players[2]!.baseUpgrades).toEqual(['HMW#147']);
        expect(p1(s).baseUpgrades ?? []).toEqual([]);
    });
});

describe('pass-4 review gaps: hostile keyframes, unit captives, stateAt parity', () => {
    // Value: protects=a keyframe with a non-array cards/upgrades list cannot throw out of normalizeEvents and blank the viewer; fails_when=repairUpgradePlays iterates raw keyframe lists without an Array.isArray guard; why_new=render() was hardened against `upgrades: 5`, this sibling reader was not; seam=none; no_claim=what the fold does with the bad keyframe
    it('repairUpgradePlays skips keyframe lists that are not arrays', () => {
        const kf = { players: { 1: { cards: [{ id: 'A', upgrades: 5 }, null, { id: 7, upgrades: ['U'] }], hand: [], discard: [] }, 2: { cards: 5, hand: [], discard: [] } } };
        const ev = [{ seq: 'R1', t: 'ROUND_START', round: 1, keyframe: kf }, { seq: 'R1.A.1', t: 'PASS', p: 1 }] as unknown as GameEvent[];
        expect(() => repairUpgradePlays(ev)).not.toThrow();
        expect(() => normalizeEvents(ev)).not.toThrow();
    });

    // Value: protects=a unit captor holds its captive once and the captive leaves every arena; fails_when=detach() or the CAPTURE captor lookup regresses; why_new=vectors only check final boards, where nothing is held; seam=none; no_claim=base captors (tested above)
    it('a unit captor holds its captive', () => {
        const s = fold([
            { seq: '1', t: 'MOVE', card: 'CAP', from: 'hand', to: 'ground', p: 1, kind: 'unit' },
            { seq: '2', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 2, kind: 'unit' },
            { seq: '3', t: 'MOVE', card: 'U', from: 'ground', to: 'capture', p: 2, kind: 'unit' },
            { seq: '4', t: 'CAPTURE', p: 1, card: 'U', by: 'CAP' },
        ] as unknown as GameEvent[]);
        expect(p1(s).cards[0].captured).toEqual(['U']);
        expect(s.players[2]!.cards).toEqual([]);
    });

    // Value: protects=a captive stated on a keyframe captor is released by its MOVE capture->arena; fails_when=snapToKeyframe drops card.captured or the release stops detaching it; why_new=no test snaps a keyframe with a unit holding a captive; seam=none; no_claim=stateAt (covered by the vector parity test)
    it('a captive stated on a keyframe captor is released by its MOVE', () => {
        const card = (id: string, extra = {}) => ({ id, zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [], ...extra });
        const kfr = { round: 2, phase: 'action', initiative: 1, players: { 1: { seat: 1, hand: [], discard: [], cards: [card('CAP', { captured: ['U'] })] }, 2: { seat: 2, hand: [], discard: [], cards: [] } } };
        const s = fold([
            { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: kfr },
            { seq: 'R2.A.1', t: 'MOVE', card: 'U', from: 'capture', to: 'ground', p: 2, kind: 'unit' },
        ] as unknown as GameEvent[]);
        expect(p1(s).cards[0].captured).toEqual([]);
        expect(s.players[2]!.cards.map((c) => c.id)).toEqual(['U']);
    });

    // Value: protects=stateAt(seq) is the board foldFrames shows at that seq's first frame, on every vector (pilots, leaders, captives, Fortify); fails_when=the stateAt restart rule picks a keyframe that loses carried state; why_new=parity was only pinned on one hand-built pilot stream; seam=none; no_claim=files unlike any vector
    const vdir = path.join(__dirname, 'fixtures/vectors');
    const vectors = readdirSync(vdir).filter((f) => f.endsWith('.swupgn'));
    it.each(vectors)('stateAt agrees with foldFrames at every first-seen seq: %s', (file) => {
        const ev = normalizeEvents(parse(readFileSync(path.join(vdir, file), 'utf8')).events);
        const frames = foldFrames(ev);
        const seen = new Set<string>();
        ev.forEach((e, i) => {
            if (seen.has(e.seq)) return;
            seen.add(e.seq);
            expect(stateAt(ev, e.seq), e.seq).toEqual(frames[i]);
        });
    });
});

describe('stateAt keeps a base defeated before a keyframe', () => {
    const seat = (n: number, extra = {}) => ({ seat: n, hand: [], discard: [], cards: [], baseUpgrades: [], baseCaptured: [], ...extra });
    const stream = (p2: object) => [
        { seq: 'R1.A.1', t: 'DEFEAT', card: 'base@2', reason: 'ability' },
        { seq: 'R1.end', t: 'ROUND_END', round: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: seat(1), 2: p2 } } },
        { seq: 'R2.A.1', t: 'PASS', p: 1 },
    ] as unknown as GameEvent[];

    // Value: protects=stateAt agrees with foldFrames on baseDefeated when a holdings-stating keyframe omits an earlier defeat; fails_when=the restart rule ignores a base DEFEAT before the keyframe; why_new=QA probes 002/003 reproduced stateAt returning no defeat; seam=none; no_claim=keyframes that state baseDefeated:false (the format has no such value)
    it('folds from further back when the keyframe does not restate the defeat', () => {
        const ev = stream(seat(2));
        const frames = foldFrames(ev);
        ev.forEach((e, i) => expect(stateAt(ev, e.seq), e.seq).toEqual(frames[i]));
        expect(stateAt(ev, 'R2.A.1').players[2]!.baseDefeated).toBe(true);
    });

    // Value: protects=a defeat stated only by an earlier keyframe (no DEFEAT record), and a defeat restated then omitted, survive stateAt as in foldFrames; fails_when=firstDefeat counts only DEFEAT records; why_new=cycle-2 review reproduced the keyframe-only case; seam=none; no_claim=none beyond protects
    it('keeps a defeat a keyframe stated, across a later keyframe that omits it', () => {
        const kf = (round: number, p2: object) => ({ round, phase: 'action', initiative: 1, players: { 1: seat(1), 2: p2 } });
        const keyframeOnly = [
            { seq: 'R1.end', t: 'ROUND_END', round: 1, keyframe: kf(1, seat(2, { baseDefeated: true })) },
            { seq: 'R2.end', t: 'ROUND_END', round: 2, keyframe: kf(2, seat(2)) },
            { seq: 'R3.A.1', t: 'PASS', p: 1 },
        ] as unknown as GameEvent[];
        const chained = [
            { seq: 'R1.A.1', t: 'DEFEAT', card: 'base@2', reason: 'ability' },
            { seq: 'R1.end', t: 'ROUND_END', round: 1, keyframe: kf(1, seat(2, { baseDefeated: true })) },
            { seq: 'R2.end', t: 'ROUND_END', round: 2, keyframe: kf(2, seat(2)) },
            { seq: 'R3.A.1', t: 'PASS', p: 1 },
        ] as unknown as GameEvent[];
        for (const ev of [keyframeOnly, chained]) {
            const frames = foldFrames(ev);
            ev.forEach((e, i) => expect(stateAt(ev, e.seq), e.seq).toEqual(frames[i]));
            expect(stateAt(ev, 'R3.A.1').players[2]!.baseDefeated).toBe(true);
        }
    });

    it('still restarts from a keyframe that restates it', () => {
        const ev = stream(seat(2, { baseDefeated: true }));
        expect(stateAt(ev, 'R2.A.1')).toEqual(foldFrames(ev)[2]);
    });
});

describe('isCompleteKeyframe reads a null optional list as absent', () => {
    // Value: protects=a keyframe whose writer emits `resources: null` (or a null base list) is still snapped to, while an oversized list still marks it damaged; fails_when=the optional-list filter treats null as a list again; why_new=the MAX_ZONE_LIST guard added this path untested; seam=none; no_claim=a writer that actually emits null
    it('accepts null optional lists, and still refuses an oversized one', () => {
        const seat = (extra = {}) => ({ cards: [], hand: [], discard: [], ...extra });
        expect(isCompleteKeyframe({ players: { 1: seat({ resources: null, baseUpgrades: null, baseCaptured: null }), 2: seat() } })).toBe(true);
        expect(isCompleteKeyframe({ players: { 1: seat({ resources: new Array(1001).fill('X') }), 2: seat() } })).toBe(false);
    });
});

describe('leaders: flips, mirror copies and pilots (review cycle-2 cells)', () => {
    const card = (id: string, extra = {}) => ({ id, zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [], ...extra });
    const seat = (n: number, extra = {}) => ({ seat: n, hand: [], discard: [], cards: [], ...extra });
    const start = (p1: object, p2: object = seat(2)) => ({ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: p1, 2: p2 } } });

    // Value: protects=a flip changes only onStartingSide on a keyframe-named leader, both ways, and a lone flip seeds the leader; fails_when=LEADER_FLIP replaces or resets the leader entry; why_new=no test flipped a leader the keyframe named; seam=none; no_claim=render()'s side tracking
    it('flips a keyframe-named leader both ways, keeping its other state, and seeds an unnamed one', () => {
        const leader = { id: 'TWI#017', deployed: false, exhausted: true, epicActionUsed: true };
        const back = fold([start(seat(1, { leader })), { seq: 'R1.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false }] as unknown as GameEvent[]);
        expect(p1(back).leader).toEqual({ ...leader, onStartingSide: false });
        const front = fold([start(seat(1, { leader })), { seq: 'R1.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false }, { seq: 'R1.A.2', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: true }] as unknown as GameEvent[]);
        expect(p1(front).leader).toEqual({ ...leader, onStartingSide: true });
        const seeded = fold([{ seq: 'R1.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: true }] as unknown as GameEvent[]);
        expect(p1(seeded).leader).toMatchObject({ id: 'TWI#017', onStartingSide: true });
    });

    // Value: protects=in a mirror match only the seat owning SET#NUM:2 flips; fails_when=the flip owner is found by base id; why_new=no flip test used a copy id; seam=none; no_claim=render()'s collapsed mirror story (upstream)
    it('flips only the mirror copy that the record names', () => {
        const l = (id: string) => ({ id, deployed: false, exhausted: false, epicActionUsed: false });
        const s = fold([start(seat(1, { leader: l('TWI#017') }), seat(2, { leader: l('TWI#017:2') })), { seq: 'R1.A.1', t: 'LEADER_FLIP', p: 2, card: 'TWI#017:2', onStartingSide: false }] as unknown as GameEvent[]);
        expect(s.players[2]!.leader?.onStartingSide).toBe(false);
        expect(p1(s).leader?.onStartingSide).toBeUndefined();
    });

    // Value: protects=a pilot leader that comes home leaves its host and is undeployed; fails_when=the MOVE arena->base stops detaching or undeploying a leader; why_new=only unit leaders were sent home; seam=none; no_claim=the deploy record's own shape
    it('a pilot leader coming home leaves its vehicle and is no longer deployed', () => {
        const s = fold([
            start(seat(1, { cards: [card('V')], leader: { id: 'JTL#001', deployed: false, exhausted: false, epicActionUsed: false } })),
            { seq: 'R1.A.1', t: 'DEPLOY_LEADER', p: 1, card: 'JTL#001', zone: 'space', kind: 'upgrade', target: 'V' },
            { seq: 'R1.A.2', t: 'MOVE', card: 'JTL#001', from: 'space', to: 'base', p: 1, kind: 'unit' },
        ] as unknown as GameEvent[]);
        expect(p1(s).cards.map((c) => c.id)).toEqual(['V']);
        expect(p1(s).cards[0].upgrades).toEqual([]);
        expect(p1(s).leader?.deployed).toBe(false);
    });

    // Value: protects=a keyframe listing a pilot leader both on its host and as its own card keeps it only on the host, still deployed; fails_when=the snap's attached-card filter skips leaders; why_new=only a non-leader sibling was snapped; seam=none; no_claim=integrity's verdict on such a keyframe
    it('a keyframe pilot leader listed twice stays only on its host', () => {
        const s = fold([start(seat(1, { cards: [card('V', { upgrades: ['JTL#001'] }), card('JTL#001')], leader: { id: 'JTL#001', deployed: true, exhausted: false, epicActionUsed: false } }))] as unknown as GameEvent[]);
        expect(p1(s).cards.map((c) => c.id)).toEqual(['V']);
        expect(p1(s).leader?.deployed).toBe(true);
    });
});

// Ported from forceteki test/server/swupgn/fold.spec.ts at 950a65a82.
describe('fold — a reserved token name (§23)', () => {
    // Value: protects=fold() itself never makes a reserved name a statusTokens key, for events that did not come through parse(); fails_when=the fold's guard is dropped; why_new=only parse() refused reserved token names; seam=none; no_claim=none beyond protects
    it('skips a STATUS_TOKEN whose token is a reserved name', () => {
        const s = fold([
            { seq: 'R1.A.1', t: 'PLAY', p: 1, card: 'SOR#108', zone: 'ground' },
            { seq: 'R1.A.2', t: 'STATUS_TOKEN', card: 'SOR#108', token: 'hasOwnProperty', count: 1 },
            { seq: 'R1.A.3', t: 'STATUS_TOKEN', card: 'SOR#108', token: 'advantage', count: 1 },
        ] as GameEvent[]);
        const c = s.players[1]?.cards.find((x) => x.id === 'SOR#108');
        expect(Object.keys(c!.statusTokens)).toEqual(['advantage']);
        expect(() => String(c!.statusTokens)).not.toThrow();
    });
});

// Ported from forceteki test/server/swupgn/fold.spec.ts at a2c013963, plus the client's older spellings.
describe('fold — Credit and Force tokens by the name part of their id (spec 6.1)', () => {
    const credits = (card: string) => fold([{ seq: 'R1.A.1a', t: 'MOVE', card, from: 'outsideTheGame', to: 'base', p: 1 }] as GameEvent[]).players[1]!.credits;
    const force = (card: string) => fold([{ seq: 'R1.A.1a', t: 'MOVE', card, from: 'outsideTheGame', to: 'base', p: 1 }] as GameEvent[]).players[1]!.hasForce;

    // Value: protects=the fold recognises a Credit by the same name rule as the validator, so the degraded form and a later copy count; fails_when=the fold matches only `TOKEN:credit#`; why_new=fold and validate disagreed on `TOKEN:credit`; seam=none; no_claim=what the validator reports for the same ids
    it('counts a Credit token written in the degraded form, and a later copy of one', () => {
        const s = fold([
            { seq: 'R1.A.1a', t: 'MOVE', card: 'TOKEN:credit', from: 'outsideTheGame', to: 'base', p: 1 },
            { seq: 'R1.A.1b', t: 'MOVE', card: 'TOKEN:credit:2', from: 'outsideTheGame', to: 'base', p: 1 },
        ] as GameEvent[]);
        expect(s.players[1]?.credits).toBe(2);
    });

    // Value: protects=the client's Credit/Force test agrees with tokenNameOf on current ids (`:1` is not a copy suffix) while still reading the pre-2026-09 title spellings; fails_when=isCreditToken strips any `:N` again, or the older spellings are dropped; why_new=upstream moved to tokenNameOf at 87d477f39; seam=none; no_claim=what the validator reports
    it('TOKEN:credit and TOKEN:credit:2 count, TOKEN:credit:1 does not; older title spellings still count', () => {
        expect(credits('TOKEN:credit')).toBe(1);
        expect(credits('TOKEN:credit:2')).toBe(1);
        expect(credits('TOKEN:credit#8015500527:2')).toBe(1);
        expect(credits('TOKEN:credit:1')).toBe(0);
        expect(credits('TOKEN:Credit:2')).toBe(1);
        expect(force('TOKEN:the-force#4571900905')).toBe(true);
        expect(force('TOKEN:the-force:1')).toBe(false);
        expect(force('TOKEN:The Force')).toBe(true);
    });
});

describe('fold record order (spec §9.1 [W-18])', () => {
    // Value: protects=`for`, not file position, is what ties a record to its action; fails_when=the fold depends on a writer emitting an action's records before announcing it; why_new=every vector comes from one writer, which always emits them first; seam=none; no_claim=records with no `for`
    it('folds the same when a writer announces the action before its records', () => {
        const dir = path.join(__dirname, 'fixtures/vectors');
        const events = parse(readFileSync(path.join(dir, 'arrest.swupgn'), 'utf8')).events;
        const announceFirst = (list: GameEvent[], action: string): GameEvent[] => {
            const owned = list.filter((e) => e.for === action);
            const rest = list.filter((e) => e.for !== action);
            const at = rest.findIndex((e) => e.seq === action);
            return [...rest.slice(0, at + 1), ...owned, ...rest.slice(at + 1)];
        };
        expect(events.filter((e) => e.for === 'R1.A.1').map((e) => e.t)).toEqual(['EXHAUST_RESOURCES', 'MOVE', 'STATS', 'EXHAUST']);
        expect(events.filter((e) => e.for === 'R2.A.3').map((e) => e.t)).toEqual(['CHOICE', 'EXHAUST']);
        const reordered = announceFirst(announceFirst(events, 'R1.A.1'), 'R2.A.3');
        expect(reordered.map((e) => e.seq)).not.toEqual(events.map((e) => e.seq));
        const plain = (x: unknown) => JSON.parse(JSON.stringify(x));
        expect(plain(stateAt(reordered, 'R1.A.2'))).toEqual(plain(stateAt(events, 'R1.A.2')));
        expect(plain(stateAt(reordered, 'R2.A.4'))).toEqual(plain(stateAt(events, 'R2.A.4')));
        expect(plain(fold(reordered))).toEqual(JSON.parse(readFileSync(path.join(dir, 'arrest.fold.json'), 'utf8')));
    });

    // Value: protects=a MOVE out of an arena folds the same whether or not it carries kind (spec 6.5); fails_when=the fold starts reading kind on a move that leaves an arena; why_new=no vector holds an undeploy move; seam=none; no_claim=a kind that disagrees with the card
    it('folds an undeploy move the same with or without kind', () => {
        const plain = (x: unknown) => JSON.parse(JSON.stringify(x));
        const arrive = { seq: 'R1.A.1', t: 'MOVE', p: 1, card: 'SOR#108', from: 'hand', to: 'ground', kind: 'unit' } as GameEvent;
        const without = [arrive, { seq: 'R1.A.2', t: 'MOVE', p: 1, card: 'SOR#108', from: 'ground', to: 'base' }] as GameEvent[];
        const withKind = [arrive, { seq: 'R1.A.2', t: 'MOVE', p: 1, card: 'SOR#108', from: 'ground', to: 'base', kind: 'unit' }] as GameEvent[];
        expect(plain(fold(withKind))).toEqual(plain(fold(without)));
    });
});
