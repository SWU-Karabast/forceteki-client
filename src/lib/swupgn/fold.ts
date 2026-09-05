import type { GameEvent, ReducedState, PlayerState, CardInstanceState, Seat } from './types';
import { eventKind, isCreditToken, isForceToken, isStatusTokenCard } from './tokens';

// Vendored from forceteki swupgn/src/fold.ts at 78566bda. Every block marked CLIENT-OWNED is
// a documented divergence (see VERSION.md); everything else mirrors upstream and should be
// re-diffed, not rewritten, on the next sync.

function emptyPlayer(seat: Seat): PlayerState {
    return {
        seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [],
        resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false,
        discard: [], cards: [],
    };
}

export function emptyState(): ReducedState {
    return { round: 0, phase: 'setup', initiative: null, players: { 1: emptyPlayer(1), 2: emptyPlayer(2) } };
}

/** `x` if it is an array, else `[]`. A file is untrusted input; `cards: 5` must not throw. */
function arr<T>(x: unknown): T[] {
    return Array.isArray(x) ? (x as T[]) : [];
}

/** CLIENT-OWNED alias of `arr` for the client's own per-tab utilities. */
export const asIdList = (v: unknown): string[] => arr<string>(v);

/** One seat of a keyframe with the shape the fold dereferences (spec §13). */
function isCompleteSeat(p: unknown): p is PlayerState {
    if (typeof p !== 'object' || p === null) {
        return false;
    }
    const ps = p as Partial<PlayerState>;
    if (!Array.isArray(ps.cards) || !Array.isArray(ps.hand) || !Array.isArray(ps.discard)) {
        return false;
    }
    return ps.cards.every((c) => typeof c === 'object' && c !== null);
}

/**
 * A keyframe REPLACES the reader's whole state, so one that is malformed or missing a seat
 * must not be snapped to: spec §13 says ignore it and keep folding. This is also the trust
 * boundary for a hostile file. Without it `keyframe: {}` or `cards: "x"` surfaces as an
 * uncaught TypeError in the browser rather than as a damaged checkpoint.
 */
export function isCompleteKeyframe(k: unknown): k is ReducedState {
    if (typeof k !== 'object' || k === null) {
        return false;
    }
    const players = (k as { players?: unknown }).players;
    if (typeof players !== 'object' || players === null) {
        return false;
    }
    for (const seat of [1, 2] as Seat[]) {
        if (!isCompleteSeat((players as Record<number, unknown>)[seat])) {
            return false;
        }
    }
    return true;
}

/** True for a ROUND_START/ROUND_END that carries a keyframe a reader may snap to. */
export function hasSnapKeyframe(e: GameEvent): e is GameEvent & { keyframe: ReducedState } {
    return (e.t === 'ROUND_START' || e.t === 'ROUND_END') && isCompleteKeyframe(e.keyframe);
}

/**
 * True only for a real seat number. `Seat` is erased at runtime, so a `p` field read out of
 * an untrusted `.swupgn` can be any JSON value -- including `"__proto__"`, which turns the
 * bracket access below into a write against `Object.prototype` for every object in the
 * process. Folding is a public API that runs in the browser on files a user supplies, so the
 * check belongs here, at the one point every seat lookup routes through.
 */
export function isSeat(seat: unknown): seat is Seat {
    return seat === 1 || seat === 2;
}

function player(s: ReducedState, seat: Seat): PlayerState | undefined {
    if (!isSeat(seat)) {
        return undefined;
    }
    if (!s.players[seat]) {
        s.players[seat] = emptyPlayer(seat);
    }
    return s.players[seat]!;
}

/** Resolve a target ref like "base@2" or "SOR#095:2" to the owning seat (best-effort). */
function seatOfBaseRef(ref: string): Seat | null {
    const m = /^base@([12])$/.exec(String(ref));
    return m ? (Number(m[1]) as Seat) : null;
}

function isTokenId(id: string): boolean {
    return typeof id === 'string' && id.startsWith('TOKEN:');
}

function findCard(s: ReducedState, id: string): CardInstanceState | undefined {
    for (const seat of [1, 2] as Seat[]) {
        const c = s.players[seat]?.cards.find((x) => x.id === id);
        if (c) {
            return c;
        }
    }
    return undefined;
}

function newCard(id: string, zone: string): CardInstanceState {
    return { id, zone, damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [] };
}

/**
 * Put a card in an arena, ONCE.
 *
 * Placement is idempotent by id because a real stream reports the same arrival twice: the
 * engine emits the zone transition as a MOVE (the fold's source of truth) and a PLAY /
 * PLAY_SMUGGLE / DEPLOY_LEADER summary beside it. Pushing on both duplicated every unit in
 * play — invisible while keyframes kept snapping the state back, but wrong for `stateAt()`
 * anywhere between two keyframes, which is exactly what a replay scrubber asks for.
 */
function placeCard(s: ReducedState, seat: Seat, id: string, zone: string): void {
    const existing = findCard(s, id);
    if (existing) {
        existing.zone = zone;
        return;
    }
    player(s, seat)?.cards.push(newCard(id, zone));
}

/** Remove `id` from every seat's arena list, wherever it is. */
function removeFromArenas(s: ReducedState, id: string): void {
    for (const seat of [1, 2] as Seat[]) {
        const owner = s.players[seat];
        if (!owner) {
            continue;
        }
        const idx = owner.cards.findIndex((c) => c.id === id);
        if (idx >= 0) {
            owner.cards.splice(idx, 1);
            return;
        }
    }
}

/**
 * Attach `id` to `hostId`'s `upgrades`, once. Both the attaching MOVE (`attachedTo`) and the
 * PLAY_UPGRADE / DEPLOY_LEADER beside it (`target`) name the host, so this must be idempotent.
 * Token upgrades never go here: they are the shields/experience/statusTokens counters.
 */
function attachTo(s: ReducedState, hostId: string, id: string): void {
    if (isTokenId(id)) {
        return;
    }
    const host = findCard(s, hostId);
    if (host && !host.upgrades.includes(id)) {
        host.upgrades.push(id);
    }
}

/**
 * Take `id` off every card's `upgrades` and `captured` lists. Keyed on the zone transition
 * (a card left an arena, or the capture zone), not on `kind`: a pilot's exit says `kind:
 * "unit"`, and no exit record names a host (spec §10.1).
 */
function detach(s: ReducedState, id: string): void {
    for (const seat of [1, 2] as Seat[]) {
        for (const c of s.players[seat]?.cards ?? []) {
            const u = c.upgrades.indexOf(id);
            if (u >= 0) {
                c.upgrades.splice(u, 1);
            }
            const captured = arr<string>(c.captured);
            const k = captured.indexOf(id);
            if (k >= 0) {
                captured.splice(k, 1);
                c.captured = captured;
            }
        }
    }
}

/** Move `n` of `ps`'s resources from ready to exhausted (`n` > 0) or back (`n` < 0), clamped. */
function shiftResources(ps: PlayerState, n: number): void {
    if (n > 0) {
        const moved = Math.min(n, ps.resourcesReady);
        ps.resourcesReady -= moved;
        ps.resourcesExhausted += moved;
    } else if (n < 0) {
        const moved = Math.min(-n, ps.resourcesExhausted);
        ps.resourcesExhausted -= moved;
        ps.resourcesReady += moved;
    }
}

/** One resource entered (`+1`) or left (`-1`) the row, in the `exhausted` or ready bucket. */
function countResource(ps: PlayerState, delta: 1 | -1, exhausted: boolean): void {
    if (exhausted) {
        ps.resourcesExhausted = Math.max(0, ps.resourcesExhausted + delta);
    } else {
        ps.resourcesReady = Math.max(0, ps.resourcesReady + delta);
    }
}

/**
 * A Credit or Force token arrived at (`+1`) or left (`-1`) `ps`'s base.
 *
 * CLIENT-OWNED on the predicates: upstream matches the two reserved names by the
 * `TOKEN:credit#` / `TOKEN:the-force#` prefix (spec §6.1); tokens.ts also accepts the
 * pre-1.0 shape (`TOKEN:The Force`) that files in the wild carry.
 */
function countBaseToken(ps: PlayerState, id: string, delta: 1 | -1): void {
    if (isCreditToken(id)) {
        ps.credits = Math.max(0, ps.credits + delta);
    } else if (isForceToken(id)) {
        ps.hasForce = delta > 0;
    }
}

const ARENA_ZONES = new Set(['ground', 'space']);

/**
 * Engine truth: every zone transition is an OnCardMoved → MOVE event. handSize, the resource
 * counts, credits, the Force and the in-play `cards[]` set are therefore reconstructed from
 * MOVE (the single source of truth), NOT from DRAW/RESOURCE/PLAY, which are higher-level
 * summary records that always coincide with the underlying MOVEs (a DRAW carries the
 * cumulative count of the deck→hand MOVEs just emitted; double-counting them would
 * diverge from the keyframe). DRAW still records the omniscient `hand[]` contents and
 * PLAY/PLAY_UPGRADE still place a card so unit-level fold tests that drive PLAY without
 * a paired MOVE keep working; MOVE placement is idempotent by id so PLAY+MOVE in real
 * streams does not double-add.
 */
function applyMoveCounts(s: ReducedState, e: { card: string; from: string; to: string; p?: Seat; kind?: 'unit' | 'upgrade'; attachedTo?: string; exhausted?: boolean }): void {
    // Leaving an arena, or the capture zone, ends every attachment and every captivity of
    // this card, whatever `kind` says: a pilot's exit says `unit`, and exits name no host.
    if ((ARENA_ZONES.has(e.from) && !ARENA_ZONES.has(e.to)) || e.from === 'capture') {
        detach(s, e.card);
    }

    // CLIENT-OWNED. The role this move enacts: `kind` when stated; otherwise, per spec
    // §22.1, a move that names a host is an attachment (files written before `kind`).
    const kind = eventKind(e);

    if (e.p == null) {
        // Without a seat we can only update zone on an already-tracked card; counts are
        // unattributable. Real engine streams always carry the seat.
        const c = findCard(s, e.card);
        if (c) {
            c.zone = e.to;
        }
        return;
    }
    const ps = player(s, e.p);
    if (!ps) {
        // Seat wasn't 1 or 2 -- a malformed or hostile file. Drop the record rather than
        // attributing its counts to an invented seat.
        return;
    }

    // Hand membership: count AND contents.
    //
    // CLIENT-OWNED on the contents. Upstream only counts here and appends to `hand[]` from
    // DRAW, so `hand[]` grows monotonically — every card ever drawn stays in it. That is
    // harmless for a final-state fold (`hand[]` is outside the integrity gate), but a
    // scrubber RENDERS this array: without the removal a player's hand shows cards they
    // played ten rounds ago, and repeated ids produce duplicate React keys.
    if (e.to === 'hand' && e.from !== 'hand') {
        ps.handSize += 1;
        if (!ps.hand.includes(e.card)) ps.hand.push(e.card);
    } else if (e.from === 'hand' && e.to !== 'hand') {
        ps.handSize = Math.max(0, ps.handSize - 1);
        const hi = ps.hand.indexOf(e.card);
        if (hi >= 0) ps.hand.splice(hi, 1);
    }

    // Resource row. A card enters ready (an EXHAUST_RESOURCES beside the move says otherwise);
    // it leaves from whichever bucket `exhausted` names.
    if (e.to === 'resource' && e.from !== 'resource') {
        countResource(ps, 1, false);
    } else if (e.from === 'resource' && e.to !== 'resource') {
        countResource(ps, -1, e.exhausted === true);
    }

    // Credits and the Force: the only two things that live in `base` and are counted.
    if (e.to === 'base' && e.from !== 'base') {
        countBaseToken(ps, e.card, 1);
    } else if (e.from === 'base' && e.to !== 'base') {
        countBaseToken(ps, e.card, -1);
    }

    // CLIENT-OWNED. Discard membership, both directions. The viewer RENDERS the discard
    // pile keyed by card id, so an append-only pile duplicates React keys and drifts
    // numCardsInDeck; a card that leaves the discard has to leave the array too.
    if (e.to === 'discard' && e.from !== 'discard') {
        if (!ps.discard.includes(e.card)) ps.discard.push(e.card);
    } else if (e.from === 'discard' && e.to !== 'discard') {
        const di = ps.discard.indexOf(e.card);
        if (di >= 0) ps.discard.splice(di, 1);
    }

    // In-play (arena) membership. An UPGRADE never has any: it attaches to a unit, and its
    // effect on the board is carried by the host's own records (SHIELD_GAIN, EXPERIENCE_GAIN,
    // STATUS_TOKEN) or by `attachedTo` here. Without `kind` a reader cannot tell a token
    // upgrade from a token unit — both are `TOKEN:<name>#<id>` — and folding the upgrade in
    // put a phantom card in the arena. The hand/resource counts above still apply: an upgrade
    // really does leave the hand.
    if (kind === 'upgrade') {
        if (ARENA_ZONES.has(e.to) && e.attachedTo) {
            // CLIENT-OWNED: a same-arena move naming a NEW host (an upgrade changing units)
            // moves it over; the writer never emits one, but the viewer keys off the record.
            detach(s, e.card);
            attachTo(s, e.attachedTo, e.card);
        }
        const upgrade = findCard(s, e.card);
        if (upgrade) {
            upgrade.zone = e.to;
        }
        return;
    }

    const existing = findCard(s, e.card);
    if (ARENA_ZONES.has(e.to)) {
        if (existing) {
            existing.zone = e.to;
        } else {
            ps.cards.push(newCard(e.card, e.to));
        }
    } else if (existing && ARENA_ZONES.has(existing.zone)) {
        removeFromArenas(s, e.card);
    } else if (existing) {
        existing.zone = e.to;
    }
}

/** Apply a single event to state, mutating and returning it. */
export function reduce(s: ReducedState, e: GameEvent): ReducedState {
    // CLIENT-OWNED. An events line of `null`, `5` or `"x"` parses fine as JSON and then
    // throws on the first property read, taking the whole replay down with no error
    // boundary to catch it. Skip it instead.
    if (e == null || typeof e !== 'object') {
        return s;
    }
    // CLIENT-OWNED, pre-1.0 compatibility. A 1.0 stream states `kind`, which applyMoveCounts
    // acts on; a 1.1 file states nothing, so a token upgrade would fold into an arena as a
    // card with no printed identity. isStatusTokenCard falls back to a name list for exactly
    // those files. Equivalent to upstream for a 1.0 record: a token upgrade never joins an
    // arena, never attaches by id, and its DEFEAT finds nothing to detach.
    if (e.t !== 'STATUS_TOKEN' && 'card' in e && typeof e.card === 'string'
        && isStatusTokenCard(e.card, eventKind(e))) {
        return s;
    }
    switch (e.t) {
        case 'ROUND_START': s.round = e.round; break;
        case 'PHASE_START': s.phase = (e.phase as ReducedState['phase']); break;
        case 'CLAIM_INITIATIVE': s.initiative = e.p; break;
        // handSize/resourcesReady are driven by MOVE (the engine's source of truth for
        // zone transitions); see applyMoveCounts. PLAY only places the card in its zone —
        // the matching hand->zone MOVE accounts for the hand decrement.
        case 'PLAY': case 'PLAY_SMUGGLE':
            placeCard(s, e.p, e.card, e.zone ?? 'ground'); break;
        case 'PLAY_EVENT': {
            // CLIENT-OWNED dedupe: the paired hand->discard MOVE already listed it.
            const ps = player(s, e.p);
            if (ps && !ps.discard.includes(e.card)) ps.discard.push(e.card);
            break;
        }
        case 'PLAY_UPGRADE': {
            // An upgrade is NEVER an arena card, so there is no fallback placement: if the
            // host isn't tracked the attachment is simply not modelled. Placing it instead
            // (as this used to) put a phantom "unit" in the arena that no keyframe agrees
            // with — a real upgrade, SEC#038, showed up that way in a recorded game.
            if (e.target) {
                attachTo(s, e.target, e.card);
            }
            break;
        }
        case 'DEPLOY_LEADER': {
            // Deployed as a pilot: an attachment, never a body. Same rule as PLAY_UPGRADE.
            if (e.kind === 'upgrade') {
                if (e.target) {
                    attachTo(s, e.target, e.card);
                }
                break;
            }
            placeCard(s, e.p, e.card, e.zone ?? 'ground');
            break;
        }
        case 'TAKE_CONTROL': {
            // A control change moves nothing between zones, so no MOVE carries it: re-seat
            // the card here. An arena card moves between the seats' `cards` lists with its
            // state intact; a resource shifts one resource from `from` to `p`; a Credit or
            // Force token in `base` shifts one credit, or the Force, from `from` to `p`.
            const ps = player(s, e.p);
            if (!ps) {
                break;
            }
            if (e.zone === 'resource' || e.zone === 'base') {
                if (!isSeat(e.from)) {
                    break;
                }
                const fromPs = player(s, e.from);
                if (!fromPs) {
                    break;
                }
                if (e.zone === 'resource') {
                    countResource(fromPs, -1, e.exhausted === true);
                    countResource(ps, 1, e.exhausted === true);
                } else {
                    countBaseToken(fromPs, e.card, -1);
                    countBaseToken(ps, e.card, 1);
                }
                break;
            }
            if (!ARENA_ZONES.has(e.zone ?? '')) {
                break; // no zone (an early-1.0 note) or a zone the fold doesn't track: nothing to re-seat
            }
            for (const seat of [1, 2] as Seat[]) {
                const owner = s.players[seat];
                if (!owner || seat === e.p) {
                    continue;
                }
                const idx = owner.cards.findIndex((c) => c.id === e.card);
                if (idx >= 0) {
                    ps.cards.push(owner.cards.splice(idx, 1)[0]);
                    break;
                }
            }
            break;
        }
        case 'CAPTURE': {
            // The MOVE out of the arena already removed the card (idempotent here); the
            // captor now holds it. A base captor (`base@N`) is not modelled: nothing today
            // captures with a base, and the card is out of play either way.
            removeFromArenas(s, e.card);
            const captor = e.by ? findCard(s, e.by) : undefined;
            if (captor) {
                const captured = arr<string>(captor.captured);
                if (!captured.includes(e.card)) {
                    captured.push(e.card);
                }
                captor.captured = captured;
            }
            break;
        }
        case 'RESCUE':
            // Back to play: the paired MOVE out of `capture` places it and already detached
            // it from its captor. Detach again here so a RESCUE that arrives first is right too.
            detach(s, e.card);
            break;
        case 'CREATE_TOKEN':
            if (e.kind !== 'upgrade') { placeCard(s, e.p, e.token, e.zone); }
            break;
        case 'EXHAUST_RESOURCES': case 'READY_RESOURCES': {
            // `amount | 0` turns a hostile non-number into 0 rather than NaN.
            const ps = player(s, e.p);
            if (ps) {
                shiftResources(ps, (e.t === 'EXHAUST_RESOURCES' ? 1 : -1) * Math.max(0, e.amount | 0));
            }
            break;
        }
        case 'DAMAGE': {
            const baseSeat = seatOfBaseRef(e.tgt);
            if (baseSeat) {
                const bp = player(s, baseSeat);
                if (bp) {
                    bp.baseHp = e.hp;
                }
            } else {
                const c = findCard(s, e.tgt);
                if (c) {
                    c.damage = Math.max(0, c.damage + e.amt);
                }
            }
            break;
        }
        case 'OVERWHELM': {
            const baseSeat = seatOfBaseRef(e.tgt);
            if (baseSeat) {
                const bp = player(s, baseSeat);
                if (bp) {
                    bp.baseHp = e.hp;
                }
            }
            break;
        }
        case 'HEAL': {
            const baseSeat = seatOfBaseRef(e.tgt);
            if (baseSeat) {
                const bp = player(s, baseSeat);
                if (bp) {
                    bp.baseHp = e.hp;
                }
            } else {
                const c = findCard(s, e.tgt);
                if (c) {
                    c.damage = Math.max(0, c.damage - e.amt);
                }
            }
            break;
        }
        case 'DEFEAT': {
            // A defeated card stops being anyone's upgrade or captive, whether or not it was
            // ever an arena card of its own (an upgrade never is).
            detach(s, e.card);
            for (const seat of [1, 2] as Seat[]) {
                const ps = s.players[seat];
                if (!ps) {
                    continue;
                }
                const idx = ps.cards.findIndex((c) => c.id === e.card);
                if (idx >= 0) {
                    // CLIENT-OWNED dedupe: a paired arena->discard MOVE may also have added it.
                    if (!ps.discard.includes(ps.cards[idx].id)) ps.discard.push(ps.cards[idx].id);
                    ps.cards.splice(idx, 1);
                }
            }
            break;
        }
        case 'EXHAUST': { const c = findCard(s, e.card); if (c) { c.exhausted = true; } break; }
        case 'READY': { const c = findCard(s, e.card); if (c) { c.exhausted = false; } break; }
        // MOVE is the single source of truth for handSize/resourcesReady and arena
        // membership (see applyMoveCounts). DRAW/DISCARD/RESOURCE no longer mutate those
        // counts — they coincide with the underlying MOVEs and would double-count.
        case 'MOVE': applyMoveCounts(s, e); break;
        // CLIENT-OWNED: DRAW/DISCARD dedupe — the paired MOVEs already added these ids, and
        // double-adding produced duplicate ids (and duplicate React keys) when a card was
        // drawn, played and drawn again.
        case 'DRAW': {
            const ps = player(s, e.p);
            if (ps) for (const c of arr<string>(e.cards)) if (!ps.hand.includes(c)) ps.hand.push(c);
            break;
        }
        case 'DISCARD': {
            const ps = player(s, e.p);
            if (ps) for (const c of arr<string>(e.cards)) if (!ps.discard.includes(c)) ps.discard.push(c);
            break;
        }
        case 'RESOURCE': break;
        case 'SHIELD_GAIN': { const c = findCard(s, e.card); if (c) { c.shields += e.count ?? 1; } break; }
        case 'SHIELD_USE': { const c = findCard(s, e.card); if (c) { c.shields = Math.max(0, c.shields - (e.count ?? 1)); } break; }
        // `count` may be negative: a token leaving its host is recorded as the same event with a
        // negative delta (see SwuPgnRecorder.tokenRecord). Counts clamp at 0, and a status token
        // that reaches 0 is DELETED rather than left as `{advantage: 0}` — an engine keyframe
        // reports a host with no tokens as `statusTokens: {}`, and the integrity gate compares
        // the two by JSON equality.
        case 'EXPERIENCE_GAIN': { const c = findCard(s, e.card); if (c) { c.experience = Math.max(0, c.experience + e.count); } break; }
        case 'STATUS_TOKEN': {
            const c = findCard(s, e.card);
            if (c) {
                const next = Math.max(0, (c.statusTokens[e.token] ?? 0) + e.count);
                c.statusTokens = Object.fromEntries(
                    Object.entries({ ...c.statusTokens, [e.token]: next }).filter(([, n]) => n > 0)
                );
            }
            break;
        }
        // Pure-log events with no state delta:
        case 'ATTACK': case 'PASS': case 'CHOICE': case 'MULLIGAN':
        case 'KEEP_HAND': case 'MODAL_CHOICE': case 'ABILITY_ACTIVATE': case 'SHUFFLE':
        case 'SEARCH': case 'REVEAL':
        case 'TRIGGER': case 'PHASE_END': case 'ROUND_END': case 'GAME_END':
            break;
        default: { const _exhaustive: never = e; void _exhaustive; break; }
    }
    return s;
}

function clone(s: ReducedState): ReducedState {
    return JSON.parse(JSON.stringify(s));
}

const finiteOr = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);

/** CLIENT-OWNED. A keyframe list longer than any real pile is a hostile file; every frame clones it. */
const MAX_KEYFRAME_LIST = 200;
const stringList = (v: unknown): string[] => (Array.isArray(v) ? v.slice(0, MAX_KEYFRAME_LIST).map(String) : []);

/** CLIENT-OWNED. A keyframe card with the CardInstanceState shape guaranteed; extra fields
 *  a newer writer adds ride through untouched, and the snapshot stats are kept only when
 *  they are numbers. */
function normalizeCard(c: CardInstanceState): CardInstanceState {
    const r = c as Partial<CardInstanceState>;
    const tokens = r.statusTokens;
    return {
        ...r,
        id: String(r.id), zone: String(r.zone ?? ''),
        damage: finiteOr(r.damage, 0), exhausted: r.exhausted === true,
        upgrades: stringList(r.upgrades),
        shields: finiteOr(r.shields, 0), experience: finiteOr(r.experience, 0),
        statusTokens: tokens != null && typeof tokens === 'object' && !Array.isArray(tokens) ? tokens : {},
        captured: stringList(r.captured),
        power: typeof r.power === 'number' && Number.isFinite(r.power) ? r.power : undefined,
        hp: typeof r.hp === 'number' && Number.isFinite(r.hp) ? r.hp : undefined,
    };
}

/** CLIENT-OWNED. A complete keyframe seat with every scalar coerced and every list capped. */
function normalizePlayer(seat: Seat, r: PlayerState): PlayerState {
    const d = emptyPlayer(seat);
    return {
        ...r, seat,
        baseHp: finiteOr(r.baseHp, d.baseHp), baseMaxHp: finiteOr(r.baseMaxHp, d.baseMaxHp),
        handSize: finiteOr(r.handSize, 0), hand: stringList(r.hand),
        resourcesReady: finiteOr(r.resourcesReady, 0), resourcesExhausted: finiteOr(r.resourcesExhausted, 0),
        credits: finiteOr(r.credits, 0), hasForce: r.hasForce === true,
        discard: stringList(r.discard),
        cards: r.cards.slice(0, MAX_KEYFRAME_LIST).map(normalizeCard),
    };
}

/**
 * CLIENT-OWNED. Snap the running fold to a keyframe, merging PER SEAT.
 *
 * Upstream replaces the state wholesale and ignores a keyframe that is missing a seat or
 * malformed (spec §13) — fine, because current writers always emit both seats. Pre-1.0
 * files in the wild do not: forceteki shipped keyframes carrying one seat or
 * `"players": {}`, and replacing wholesale drops the omitted player entirely, which leaves
 * the board with `gameState.players[connectedPlayer]` undefined. So the §13 rule is applied
 * PER SEAT: a seat with the shape the fold dereferences is snapped (scalars coerced, lists
 * capped, BEFORE the deep copy so a hostile keyframe is never cloned whole); a seat that is
 * missing or malformed is ignored and the folded seat kept. Compatibility shim, not a
 * permanent divergence.
 */
export function snapToKeyframe(s: ReducedState, kf: ReducedState): ReducedState {
    if (kf == null || typeof kf !== 'object') return s;
    const kfPlayers = (kf.players ?? {}) as Partial<Record<Seat, unknown>>;
    const players: ReducedState['players'] = { ...s.players };
    for (const seat of [1, 2] as Seat[]) {
        const kp = kfPlayers[seat];
        if (isCompleteSeat(kp)) {
            players[seat] = normalizePlayer(seat, kp);
        }
    }
    const next = clone({ round: kf.round, phase: kf.phase, initiative: kf.initiative, players });
    // CLIENT-OWNED. Early writers listed a token UPGRADE in the keyframe's `cards[]` as though
    // it were a unit — the same token they also (correctly) recorded on its host's
    // `statusTokens` — and listed an attached card TWICE: inside its host's `upgrades`, and
    // again as its own arena card. That second listing is what put Han Solo — a ground unit
    // played as a pilot onto a vehicle — in the space arena as a standalone unit. Neither
    // happens in a conformant file, where both filters are no-ops.
    for (const seat of [1, 2] as Seat[]) {
        const ps = next.players[seat];
        if (!ps?.cards) continue;
        const attached = new Set(ps.cards.flatMap((c) => c?.upgrades ?? []));
        ps.cards = ps.cards.filter((c) => !isStatusTokenCard(c?.id) && !attached.has(c?.id));
    }
    return next;
}

/** Fold `events[start..end]` (inclusive) onto `s`. */
function foldRange(events: GameEvent[], start: number, end: number, s: ReducedState): ReducedState {
    for (let i = start; i <= end; i++) {
        const e = events[i];
        if (e == null || typeof e !== 'object') { continue; }
        // A keyframe is authoritative: snap to it, then continue folding. A damaged one is
        // ignored per seat (see snapToKeyframe) and the event falls through to its rule.
        if ((e.t === 'ROUND_START' || e.t === 'ROUND_END') && e.keyframe && typeof e.keyframe === 'object') {
            s = snapToKeyframe(s, e.keyframe);
            continue;
        }
        s = reduce(s, e);
    }
    return s;
}

export function fold(events: GameEvent[]): ReducedState {
    return foldRange(events, 0, events.length - 1, emptyState());
}

/**
 * CLIENT-OWNED. Snapshot of state after each event, in a single O(n) forward pass.
 *
 * The replay scrubber needs the state at every frame; computing that as
 * `events.map((_, i) => fold(events.slice(0, i + 1)))` re-folds every prefix and is O(n^2).
 * Upstream has no equivalent — it only ever needs the final state or a single `stateAt`.
 * Measured on a 523-frame game: 3ms, 0.6MB retained.
 */
export function foldFrames(events: GameEvent[]): ReducedState[] {
    const out: ReducedState[] = new Array(events.length);
    let s = emptyState();
    for (let i = 0; i < events.length; i++) {
        s = foldRange(events, i, i, s);
        // Clone so a later in-place reduce() can't mutate an already-emitted frame.
        out[i] = clone(s);
    }
    return out;
}

/**
 * Fold up to and including `seq`.
 *
 * Starts from the last usable keyframe at or before `seq` rather than from the beginning:
 * everything before a keyframe is disposable, and a replay scrubber calls this once per
 * position, which made a full scrub O(n^2) in the stream length.
 */
export function stateAt(events: GameEvent[], seq: string): ReducedState {
    const idx = events.findIndex((e) => e?.seq === seq);
    const end = idx >= 0 ? idx : events.length - 1;
    for (let i = end; i >= 0; i--) {
        const e = events[i];
        if (e != null && typeof e === 'object' && hasSnapKeyframe(e)) {
            return foldRange(events, i + 1, end, snapToKeyframe(emptyState(), e.keyframe));
        }
    }
    return foldRange(events, 0, end, emptyState());
}
