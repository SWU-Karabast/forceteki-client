import type { GameEvent, ReducedState, PlayerState, CardInstanceState, Seat } from './types';
import { isForceToken, isStatusTokenCard } from './tokens';

function emptyPlayer(seat: Seat): PlayerState {
    return {
        seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [],
        resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false,
        discard: [], cards: [],
    };
}

function emptyState(): ReducedState {
    return { round: 0, phase: 'setup', initiative: null, players: { 1: emptyPlayer(1), 2: emptyPlayer(2) } };
}

/**
 * CLIENT-OWNED. `seat` arrives from JSON.parse of an uploaded file, so it is not
 * necessarily 1 or 2 — and `s.players["__proto__"]` resolves to Object.prototype, which is
 * truthy, so the guard below used to hand Object.prototype back as a PlayerState and let
 * `ps.resourcesReady += 1` pollute it for the whole page session, silently. Anything that
 * is not a real seat gets a scratch player that is discarded with the frame.
 */
function isSeat(v: unknown): v is Seat {
    return v === 1 || v === 2;
}

function player(s: ReducedState, seat: Seat): PlayerState {
    if (!isSeat(seat)) {
        return emptyPlayer(1);
    }
    if (!Object.prototype.hasOwnProperty.call(s.players, seat) || !s.players[seat]) {
        s.players[seat] = emptyPlayer(seat);
    }
    return s.players[seat]!;
}

/** Resolve a target ref like "base@2" or "SOR#095:2" to the owning seat (best-effort). */
function seatOfBaseRef(ref: string): Seat | null {
    const m = /^base@([12])$/.exec(String(ref));
    return m ? (Number(m[1]) as Seat) : null;
}

/** CLIENT-OWNED. `cards` is typed string[] but comes off JSON.parse; a scalar is not iterable. */
function asIdList(v: unknown): string[] {
    return Array.isArray(v) ? v : [];
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
    return { id, zone, damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {} };
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
    player(s, seat).cards.push(newCard(id, zone));
}

const ARENA_ZONES = new Set(['ground', 'space']);

/**
 * Engine truth: every zone transition is an OnCardMoved → MOVE event. handSize,
 * resourcesReady and the in-play `cards[]` set are therefore reconstructed from MOVE
 * (the single source of truth), NOT from DRAW/RESOURCE/PLAY, which are higher-level
 * summary records that always coincide with the underlying MOVEs (a DRAW carries the
 * cumulative count of the deck→hand MOVEs just emitted; double-counting them would
 * diverge from the keyframe). DRAW still records the omniscient `hand[]` contents and
 * PLAY/PLAY_UPGRADE still place a card so unit-level fold tests that drive PLAY without
 * a paired MOVE keep working; MOVE placement is idempotent by id so PLAY+MOVE in real
 * streams does not double-add.
 */
function applyMoveCounts(s: ReducedState, e: { card: string; from: string; to: string; p?: Seat; kind?: 'unit' | 'upgrade' }): void {
    if (e.p == null) {
        // Without a seat we can only update zone on an already-tracked card; counts are
        // unattributable. Real engine streams always carry the seat.
        const c = findCard(s, e.card);
        if (c) { c.zone = e.to; }
        return;
    }
    const ps = player(s, e.p);

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

    // Ready-resource membership count. (Resources enter ready; exhaustion is tracked
    // separately and is out of the gated set.)
    if (e.to === 'resource' && e.from !== 'resource') {
        ps.resourcesReady += 1;
    } else if (e.from === 'resource' && e.to !== 'resource') {
        ps.resourcesReady = Math.max(0, ps.resourcesReady - 1);
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
    // STATUS_TOKEN, or PLAY_UPGRADE.target). Without `kind` a reader cannot tell a token
    // upgrade from a token unit — both are `TOKEN:<name>#<id>` — and folding the upgrade in
    // put a phantom card in the arena. The hand/resource counts above still apply: an upgrade
    // really does leave the hand.
    if (e.kind === 'upgrade') {
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
        for (const seat of [1, 2] as Seat[]) {
            const owner = s.players[seat];
            if (!owner) { continue; }
            const idx = owner.cards.findIndex((c) => c.id === e.card);
            if (idx >= 0) { owner.cards.splice(idx, 1); break; }
        }
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
    // those files. The Force is never a board card in either format — its MOVE on and off a
    // base is the only signal the stream gives for it.
    if (e.t === 'MOVE' && isForceToken(e.card) && e.p) {
        player(s, e.p).hasForce = e.to === 'base';
        return s;
    }
    if (e.t !== 'STATUS_TOKEN' && 'card' in e && typeof e.card === 'string'
        && isStatusTokenCard(e.card, 'kind' in e ? e.kind : undefined)) {
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
            const ps = player(s, e.p);
            if (!ps.discard.includes(e.card)) ps.discard.push(e.card);
            break;
        }
        case 'PLAY_UPGRADE': {
            if (e.target) {
                const host = findCard(s, e.target);
                if (host) { host.upgrades.push(e.card); }
            }
            // An upgrade is NEVER an arena card, so there is no fallback placement: if the
            // host isn't tracked the attachment is simply not modelled. Placing it instead
            // (as this used to) put a phantom "unit" in the arena that no keyframe agrees
            // with — a real upgrade, SEC#038, showed up that way in a recorded game.
            break;
        }
        case 'DEPLOY_LEADER':
            placeCard(s, e.p, e.card, e.zone ?? 'ground'); break;
        case 'CREATE_TOKEN':
            if (e.kind !== 'upgrade') { placeCard(s, e.p, e.token, e.zone); }
            break;
        case 'DAMAGE': {
            const baseSeat = seatOfBaseRef(e.tgt);
            if (baseSeat) {
                player(s, baseSeat).baseHp = e.hp;
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
                player(s, baseSeat).baseHp = e.hp;
            }
            break;
        }
        case 'HEAL': {
            const baseSeat = seatOfBaseRef(e.tgt);
            if (baseSeat) {
                player(s, baseSeat).baseHp = e.hp;
            } else {
                const c = findCard(s, e.tgt);
                if (c) {
                    c.damage = Math.max(0, c.damage - e.amt);
                }
            }
            break;
        }
        case 'DEFEAT': {
            for (const seat of [1, 2] as Seat[]) {
                const ps = s.players[seat];
                if (!ps) {
                    continue;
                }
                const idx = ps.cards.findIndex((c) => c.id === e.card);
                if (idx >= 0) {
                    // Guarded: a paired ground->discard MOVE may also add it.
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
        // CLIENT-OWNED: DRAW does NOT also push — the paired deck->hand MOVEs already added
        // these, and double-adding produced duplicate ids (and duplicate React keys) when a
        // card was drawn, played and drawn again.
        case 'DRAW': {
            const ps = player(s, e.p);
            for (const c of asIdList(e.cards)) if (!ps.hand.includes(c)) ps.hand.push(c);
            break;
        }
        case 'DISCARD': {
            const ps = player(s, e.p);
            for (const c of asIdList(e.cards)) if (!ps.discard.includes(c)) ps.discard.push(c);
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
        case 'CAPTURE': case 'RESCUE': case 'TAKE_CONTROL': case 'SEARCH': case 'REVEAL':
        case 'TRIGGER': case 'PHASE_END': case 'ROUND_END': case 'GAME_END':
            break;
        default: { const _exhaustive: never = e; void _exhaustive; break; }
    }
    return s;
}

function clone(s: ReducedState): ReducedState {
    return JSON.parse(JSON.stringify(s));
}

/**
 * CLIENT-OWNED. Snap the running fold to a keyframe, merging PER SEAT.
 *
 * Upstream replaces the state wholesale, and the spec now tells a reader to ignore a
 * keyframe missing a seat — both fine, because current writers always emit both seats.
 * Pre-1.0 files in the wild do not: forceteki shipped keyframes carrying one seat or
 * `"players": {}`, and replacing wholesale drops the omitted player entirely, which leaves
 * the board with `gameState.players[connectedPlayer]` undefined. Merging keeps the folded
 * state for a seat the keyframe omits. Compatibility shim, not a permanent divergence.
 */
export function snapToKeyframe(s: ReducedState, kf: ReducedState): ReducedState {
    const next = clone(kf);
    next.players = { ...s.players, ...next.players };
    // CLIENT-OWNED. The writer lists a token UPGRADE in the keyframe's `cards[]` as though
    // it were a unit — the same token it also (correctly) records on its host's
    // `statusTokens`. Events state `kind: 'upgrade'` and are filtered on the way through,
    // but a keyframe is snapped in wholesale, so the pseudo-card lands in an arena and
    // renders as a card with no printed identity ("IMAGE NOT FOUND" on the board).
    for (const seat of [1, 2] as Seat[]) {
        const ps = next.players[seat];
        if (!ps?.cards) continue;
        // An attached card is listed TWICE: once inside its host's `upgrades`, and again as
        // its own arena card. That second listing is what put Han Solo — a ground unit
        // played as a pilot onto a vehicle — in the space arena as a standalone unit.
        const attached = new Set(ps.cards.flatMap((c) => c?.upgrades ?? []));
        ps.cards = ps.cards.filter((c) => !isStatusTokenCard(c?.id) && !attached.has(c?.id));
    }
    return next;
}

export function fold(events: GameEvent[]): ReducedState {
    let s = emptyState();
    for (const e of events) {
        if (e == null || typeof e !== 'object') { continue; }
        // A keyframe is authoritative: snap to it, then continue folding.
        if ((e.t === 'ROUND_START' || e.t === 'ROUND_END') && e.keyframe) {
            s = snapToKeyframe(s, e.keyframe);
            continue;
        }
        s = reduce(s, e);
    }
    return s;
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
        const e = events[i];
        if (e == null || typeof e !== 'object') {
            // keep the frame slot so indices still address the event array
        } else if ((e.t === 'ROUND_START' || e.t === 'ROUND_END') && e.keyframe) {
            s = snapToKeyframe(s, e.keyframe);
        } else {
            s = reduce(s, e);
        }
        // Clone so a later in-place reduce() can't mutate an already-emitted frame.
        out[i] = clone(s);
    }
    return out;
}

/** Fold up to and including `seq`. */
export function stateAt(events: GameEvent[], seq: string): ReducedState {
    const idx = events.findIndex((e) => e.seq === seq);
    const slice = idx >= 0 ? events.slice(0, idx + 1) : events;
    return fold(slice);
}
