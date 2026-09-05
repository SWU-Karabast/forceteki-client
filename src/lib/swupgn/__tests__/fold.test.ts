import { describe, it, expect } from 'vitest';
import { fold, foldFrames, reduce, stateAt, normalizeTokenEvents, dropInertRecords, normalizeEvents, repairUpgradePlays, isStatusTokenCard, tokenArtId, parse, checkKeyframes } from '../index';
import type { GameEvent, ReducedState, PlayerState } from '../index';
import { readFileSync } from 'fs';
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
        s = reduce(s, { seq: '2', t: 'DEFEAT', card: 'U', reason: 'combat' });
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
        s = reduce(s, { seq: '2', t: 'DEFEAT', card: 'U', reason: 'combat' });
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
                    { id: 'LOF#192', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: { advantage: 1 } },
                    { id: 'TOKEN:advantage#5844562972', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {} },
                    { id: 'TOKEN:shield#8752877738', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {} },
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
    // Records copied from files the fixed forceteki writer produced on 2026-09-05: a printed
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
            const text = readFileSync(path.join(__dirname, `fixtures/${name}-2026-09-05.swupgn`), 'utf-8');
            const doc = parse(text);
            const events = normalizeEvents(doc.events);
            const frames = foldFrames(events);
            const upgradeIds = new Set(events.flatMap((e) => (e.t === 'PLAY_UPGRADE' ? [e.card] : [])));
            expect(upgradeIds.size).toBeGreaterThan(0);
            for (let i = 0; i < frames.length; i++) {
                const arena = ([1, 2] as const).flatMap((seat) => frames[i].players[seat]?.cards ?? []);
                for (const c of arena) expect(upgradeIds.has(c.id), `${name} frame ${i} (${events[i].seq})`).toBe(false);
            }
            // After the last record that moves an upgrade out of an arena, no host carries it.
            for (const id of upgradeIds) {
                const exit = events.map((e, i) => ({ e, i })).filter(({ e }) => e.t === 'MOVE' && e.card === id && ARENA.has(e.from) && !ARENA.has(e.to)).pop();
                expect(exit, `${name}: ${id} never left play`).toBeDefined();
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
                        { id: 'JTL#221', zone: 'space', damage: 0, exhausted: false, upgrades: ['JTL#203'], shields: 0, experience: 0, statusTokens: {} },
                        { id: 'JTL#203', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {} },
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
