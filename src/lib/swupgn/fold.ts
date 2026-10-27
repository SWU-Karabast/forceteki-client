import type { GameEvent, ReducedState, PlayerState, CardInstanceState, Seat } from './types';
import { eventKind, isCreditToken, isForceToken, isStatusTokenCard } from './tokens';

// Vendored from forceteki swupgn/src/fold.ts at 3c4ed35d. Every block marked CLIENT-OWNED is
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
    return { round: 0, phase: 'setup', initiative: null, initiativeTaken: false, players: { 1: emptyPlayer(1), 2: emptyPlayer(2) } };
}

/** The seat whose leader is `id`, if a keyframe or a DEPLOY_LEADER has told us. */
function leaderOwner(s: ReducedState, id: string): PlayerState | undefined {
    for (const seat of [1, 2] as Seat[]) {
        const ps = s.players[seat];
        if (ps?.leader?.id === id) {
            return ps;
        }
    }
    return undefined;
}

/** Set the ready/exhausted flag of `id` wherever it lives: an arena card, the leader, or both. */
function setExhausted(s: ReducedState, id: string, exhausted: boolean): void {
    const c = findCard(s, id);
    if (c) {
        c.exhausted = exhausted;
    }
    const owner = leaderOwner(s, id);
    if (owner?.leader) {
        owner.leader.exhausted = exhausted;
    }
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
    // Spec §13: a keyframe list over MAX_ZONE_LIST is a damaged checkpoint, not a board. An
    // optional list that is not an array (`resources: null`) is read as absent, as
    // normalizePlayer reads it, not as damage.
    const optional = [ps.baseUpgrades, ps.baseCaptured, ps.resources].filter((l) => Array.isArray(l));
    if (![ps.cards, ps.hand, ps.discard, ...optional].every((l) => Array.isArray(l) && l.length <= MAX_ZONE_LIST)) {
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
    const existing = s.players[seat];
    if (existing) {
        return existing;
    }
    const created = emptyPlayer(seat);
    s.players[seat] = created;
    return created;
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

/** A record's `count`, or `fallback` when the file gives something that is not a finite number. */
function countOr(count: unknown, fallback: number): number {
    return typeof count === 'number' && Number.isFinite(count) ? count : fallback;
}

function newCard(id: string, zone: string): CardInstanceState {
    return { id, zone, damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [] };
}

/**
 * Hard ceiling on any per-seat list the fold grows from an untrusted file: arena cards, hand,
 * discard, resources. A real game never comes close; a crafted one is trying to make a reader
 * do unbounded work. Past it, records are dropped rather than folded.
 */
const MAX_ZONE_LIST = 1000;

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
    const ps = player(s, seat);
    if (!ps) {
        return;
    }
    // Same cap, and for the same reason, as `addOnce` on the zone lists: this is the OTHER
    // unbounded growth path, and it is the expensive one. `findCard` scans every card in play,
    // so a file of N unique MOVEs into an arena folds in O(N^2) -- 40k records (under 4 MB,
    // schema-valid) took seconds of synchronous work, which in a browser is the tab and in Node
    // is the event loop. A real game never approaches this; only a crafted file does.
    if (ps.cards.length >= MAX_ZONE_LIST) {
        return;
    }
    ps.cards.push(newCard(id, zone));
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
 * Take `id` off every card's `upgrades` and `captured` lists, and off every base's captives.
 * Keyed on the zone transition (a card left an arena, or the capture zone), not on `kind`: a
 * pilot's exit says `kind: "unit"`, and no exit record names a host (spec §10.1).
 */
function detach(s: ReducedState, id: string): void {
    for (const seat of [1, 2] as Seat[]) {
        const held = s.players[seat]?.baseCaptured;
        if (Array.isArray(held)) {
            removeOne(held, id);
        }
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

/**
 * The seat's base-upgrade list, created on first use. Like `resources`, it stays ABSENT until a
 * move or a keyframe supplies one, so a file written before `baseUpgrades` existed folds to a
 * state with no `baseUpgrades` rather than to a base that misleadingly holds nothing.
 */
function baseUpgradeList(ps: PlayerState): string[] {
    if (!Array.isArray(ps.baseUpgrades)) {
        ps.baseUpgrades = [];
    }
    return ps.baseUpgrades;
}

/**
 * Attach a printed upgrade to seat `seat`'s base, once (Fortify). The attaching MOVE and the
 * PLAY_UPGRADE beside it both name the base, so this is idempotent. Token upgrades never attach
 * to a base, and the two reserved base tokens (credits, the Force) are counted, not attached.
 */
function attachToBase(s: ReducedState, seat: Seat, id: string): void {
    if (isTokenId(id)) {
        return;
    }
    const ps = player(s, seat);
    if (ps) {
        addOnce(baseUpgradeList(ps), id);
    }
}

/** Take `id` off every seat's base. Keyed on the zone transition, like `detach`: exits name no host. */
function detachFromBases(s: ReducedState, id: string): void {
    for (const seat of [1, 2] as Seat[]) {
        const list = s.players[seat]?.baseUpgrades;
        if (Array.isArray(list)) {
            removeOne(list, id);
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

/** A zone whose arrival puts a card in play: `ground` or `space`. */
export const isArena = (z: string): boolean => ARENA_ZONES.has(z);

/**
 * Zone-list membership. Every card id is unique for the whole game (the `:N` copy suffix, spec
 * §6.1), so a list can hold an id at most once and adding is idempotent by id. That is what lets
 * a MOVE and the summary record beside it (DRAW, DISCARD, DEFEAT, PLAY_EVENT) both name the same
 * card without the card landing in the pile twice.
 *
 * Zone lists are bounded by the size of a deck, so a list longer than MAX_ZONE_LIST cannot be a
 * real game. The cap exists because this parses UNTRUSTED files in a browser: `addOnce` scans the list, so a
 * single `{"t":"DRAW","cards":[...200k unique strings...]}` would otherwise cost ~2e10 string
 * comparisons and hang the tab. Past the cap the id is dropped rather than the file rejected --
 * degrading is the fold's contract, and no honest file reaches it.
 */
function addOnce(list: string[], id: string): void {
    if (list.length >= MAX_ZONE_LIST) {
        return;
    }
    if (!list.includes(id)) {
        list.push(id);
    }
}

function removeOne(list: string[], id: string): void {
    const i = list.indexOf(id);
    if (i >= 0) {
        list.splice(i, 1);
    }
}

/**
 * The seat's resource-row membership list, created on first use. It stays ABSENT until a MOVE
 * or a keyframe supplies one, so a file written before `resources` existed folds to a state
 * with no `resources` at all rather than to a misleading empty row.
 */
function resourceList(ps: PlayerState): string[] {
    if (!Array.isArray(ps.resources)) {
        ps.resources = [];
    }
    return ps.resources;
}

/**
 * Store the active seat only when the file actually names a seat. `Seat` is erased at runtime, so
 * an unguarded write puts arbitrary JSON in a field a reader will reasonably use as
 * `players[state.active]` -- the same prototype-pollution shape `isSeat` exists to stop.
 */
function setActive(s: ReducedState, active: unknown): void {
    if (isSeat(active)) {
        s.active = active;
    }
}

/**
 * Engine truth: every zone transition is an OnCardMoved → MOVE event. handSize, the resource
 * counts, credits, the Force and the in-play `cards[]` set are therefore reconstructed from
 * MOVE (the single source of truth), NOT from DRAW/RESOURCE/PLAY, which are higher-level
 * summary records that always coincide with the underlying MOVEs (a DRAW carries the
 * cumulative count of the deck→hand MOVEs just emitted; double-counting them would
 * diverge from the keyframe). `hand[]` and `discard[]` contents follow the MOVEs too; DRAW
 * and DISCARD also add their cards, idempotently (by id) with the MOVEs beside them.
 * PLAY/PLAY_UPGRADE still place a card so unit-level fold tests that drive PLAY without a
 * paired MOVE keep working; MOVE placement is idempotent by id so PLAY+MOVE in real streams
 * does not double-add.
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
    // A base's own attachments (Fortify), by the same two rules: leaving `base` ends the
    // attachment whatever the record says, and arriving as an upgrade attaches it to the base
    // `attachedTo` names. Neither needs `p` -- the base ref names the seat -- but a writer that
    // predates `attachedTo` on base moves is read by its `p`.
    if (e.from === 'base' && e.to !== 'base') {
        detachFromBases(s, e.card);
    } else if (e.to === 'base' && e.from !== 'base' && kind === 'upgrade') {
        const seat = (e.attachedTo != null ? seatOfBaseRef(e.attachedTo) : null) ?? e.p;
        if (seat != null) {
            attachToBase(s, seat, e.card);
        }
    }

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

    // Hand: the COUNT and the CONTENTS. Every MOVE names its card, so `hand[]` is exact at
    // every moment, not just at a keyframe — DRAW is only a summary of the deck→hand MOVEs
    // beside it. This used to be a client-owned divergence (upstream appended from DRAW and
    // never removed, so a scrubber rendered cards played ten rounds ago); upstream folds and
    // gates it the same way now, so it mirrors upstream — re-diff it, do not rewrite it.
    if (e.to === 'hand' && e.from !== 'hand') {
        ps.handSize += 1;
        addOnce(ps.hand, e.card);
    } else if (e.from === 'hand' && e.to !== 'hand') {
        ps.handSize = Math.max(0, ps.handSize - 1);
        removeOne(ps.hand, e.card);
    }

    // Deck count, once a keyframe has told us where it started.
    if (typeof ps.deckSize === 'number') {
        if (e.to === 'deck' && e.from !== 'deck') {
            ps.deckSize += 1;
        } else if (e.from === 'deck' && e.to !== 'deck') {
            ps.deckSize = Math.max(0, ps.deckSize - 1);
        }
    }

    // The leader coming home: its Leader Unit side left play. The recorder writes an EXHAUST
    // beside this move when the card came back exhausted (CR 3.4.5), so nothing to guess here.
    if (e.to === 'base' && isArena(e.from)) {
        const owner = leaderOwner(s, e.card);
        if (owner?.leader) {
            owner.leader.deployed = false;
        }
    }

    // Resource row: the two COUNTS and the MEMBERSHIP. A card enters ready (an
    // EXHAUST_RESOURCES beside the move says otherwise); it leaves from whichever bucket
    // `exhausted` names. Which cards are in the row is a separate question from which of them
    // are exhausted -- the row's ready state stays counted, because no record names the
    // individual card that exhausted.
    if (e.to === 'resource' && e.from !== 'resource') {
        countResource(ps, 1, false);
        addOnce(resourceList(ps), e.card);
    } else if (e.from === 'resource' && e.to !== 'resource') {
        countResource(ps, -1, e.exhausted === true);
        removeOne(resourceList(ps), e.card);
    }

    // Credits and the Force: the only two things that live in `base` and are counted.
    if (e.to === 'base' && e.from !== 'base') {
        countBaseToken(ps, e.card, 1);
    } else if (e.from === 'base' && e.to !== 'base') {
        countBaseToken(ps, e.card, -1);
    }

    // Discard: likewise the pile's CONTENTS, in engine order. DEFEAT cannot be the author —
    // a defeated unit's MOVE to discard is emitted BEFORE its DEFEAT, so by then the card is
    // already out of `cards[]`. The MOVE owns the pile; DEFEAT/DISCARD/PLAY_EVENT are
    // summaries. Mirrors upstream (it was client-owned until upstream adopted the same rule).
    if (e.to === 'discard' && e.from !== 'discard') {
        addOnce(ps.discard, e.card);
    } else if (e.from === 'discard' && e.to !== 'discard') {
        removeOne(ps.discard, e.card);
    }

    // In-play (arena) membership. An UPGRADE never has any: it attaches to a unit, and its
    // effect on the board is carried by the host's own records (SHIELD_GAIN, EXPERIENCE_GAIN,
    // STATUS_TOKEN) or by `attachedTo` here. Without `kind` a reader cannot tell a token
    // upgrade from a token unit — both are `TOKEN:<name>#<id>` — and folding the upgrade in
    // put a phantom card in the arena. The hand/resource counts above still apply: an upgrade
    // really does leave the hand.
    if (kind === 'upgrade') {
        if (ARENA_ZONES.has(e.to) && e.attachedTo) {
            // An upgrade has one host. One that arrives naming a host comes off any other (moved
            // between hosts across arenas), and a unit in play that is attached as a pilot stops
            // being a unit: arena `cards[]` holds units only, as the keyframe does.
            detach(s, e.card);
            removeFromArenas(s, e.card);
            attachTo(s, e.attachedTo, e.card);
        }
        const upgrade = findCard(s, e.card);
        if (upgrade) {
            upgrade.zone = e.to;
        }
        return;
    }

    // A unit is never anyone's upgrade. A pilot ejected from a space vehicle moves
    // space -> ground, arena to arena, so the exit rule above never detached it.
    if (ARENA_ZONES.has(e.to)) {
        detach(s, e.card);
    }
    const existing = findCard(s, e.card);
    if (ARENA_ZONES.has(e.to)) {
        if (existing) {
            existing.zone = e.to;
        } else if (ps.cards.length < MAX_ZONE_LIST) {
            // MOVE is the arena's real author (§12.1) -- PLAY only summarises -- so this is the
            // path a crafted file grows, and it must carry the same ceiling placeCard does.
            // findCard() scans every card in play, so an unbounded arena folds in O(n^2).
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
        // `active` is stated rather than derived: working out whose turn it is from the last
        // action means modelling passing and priority, which is exactly the rules knowledge the
        // format exists to spare a reader. Absent leaves the previous value alone.
        case 'ROUND_START':
            s.round = e.round;
            s.initiativeTaken = false;
            setActive(s, e.active);
            break;
        case 'PHASE_START':
            s.phase = (e.phase as ReducedState['phase']);
            setActive(s, e.active);
            break;
        case 'CLAIM_INITIATIVE': s.initiative = e.p; s.initiativeTaken = true; break;
        // handSize/resourcesReady are driven by MOVE (the engine's source of truth for
        // zone transitions); see applyMoveCounts. PLAY only places the card in its zone —
        // the matching hand->zone MOVE accounts for the hand decrement.
        case 'PLAY': case 'PLAY_SMUGGLE':
            placeCard(s, e.p, e.card, e.zone ?? 'ground'); break;
        case 'PLAY_EVENT': {
            // Idempotent beside its own hand->discard MOVE, which is the pile's author.
            const ps = player(s, e.p);
            if (ps) addOnce(ps.discard, e.card);
            break;
        }
        case 'PLAY_UPGRADE': {
            // An upgrade is NEVER an arena card, so there is no fallback placement: if the
            // host isn't tracked the attachment is simply not modelled. Placing it instead
            // (as this used to) put a phantom "unit" in the arena that no keyframe agrees
            // with — a real upgrade, SEC#038, showed up that way in a recorded game.
            if (e.target) {
                const baseSeat = seatOfBaseRef(e.target);
                if (baseSeat != null) {
                    // Fortify: the host is a base, which no `cards` entry stands for.
                    attachToBase(s, baseSeat, e.card);
                } else {
                    attachTo(s, e.target, e.card);
                }
            }
            break;
        }
        case 'DEPLOY_LEADER': {
            // The leader's status: this record names the leader (so a reader that saw no keyframe
            // yet learns which card it is), deploys it, and readies it -- a leader deploys ready
            // whatever state it was in (CR 3.4.4). An Epic Action deploy spends the Epic Action.
            const ps = player(s, e.p);
            if (ps) {
                const prev = ps.leader;
                ps.leader = {
                    id: e.card,
                    deployed: true,
                    exhausted: false,
                    epicActionUsed: (prev?.id === e.card && prev.epicActionUsed) || e.epic === true,
                };
            }
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
        case 'ABILITY_ACTIVATE': {
            if (e.epic === true) {
                // A base's Epic Action and a leader's are separate abilities on separate cards.
                // The record tells them apart by its `card`: a base is `base@N` everywhere it is
                // pointed at (§6.3), so a base ref resolves straight to a seat, and anything else
                // is a card id matched against that seat's leader.
                const baseSeat = seatOfBaseRef(e.card);
                if (baseSeat != null) {
                    const ps = player(s, baseSeat);
                    if (ps) {
                        ps.baseEpicActionUsed = true;
                    }
                    break;
                }
                const owner = leaderOwner(s, e.card);
                if (owner?.leader) {
                    owner.leader.epicActionUsed = true;
                }
            }
            break;
        }
        case 'LEADER_FLIP': {
            // A double-sided leader flips IN PLACE in the base zone -- no MOVE, no deploy -- and
            // the flip changes its title, aspects and traits. `onStartingSide` is stated, not
            // toggled, so applying it is idempotent and a reader that snapped to a keyframe mid-
            // game still lands on the right face. Falls back to the seat on the record when the
            // leader's id is not yet known (no keyframe seen, no DEPLOY_LEADER -- these leaders
            // never deploy, so that is the normal case early in a file).
            const owner = leaderOwner(s, e.card) ?? player(s, e.p);
            if (owner) {
                // A double-sided leader NEVER deploys, so in a file with no keyframe yet nothing
                // has named the seat's leader and there is no record to update. Seed one from the
                // flip itself rather than dropping the face on the floor: the id is right there,
                // and a later keyframe overwrites the whole entry anyway.
                owner.leader ??= { id: e.card, deployed: false, exhausted: false, epicActionUsed: false };
                owner.leader.onStartingSide = e.onStartingSide;
            }
            break;
        }
        case 'STATS': {
            // The engine's live numbers, stated outright. Nothing here is derived.
            const c = findCard(s, e.card);
            if (c) {
                c.power = e.power;
                c.hp = e.hp;
                if (Array.isArray(e.keywords)) {
                    c.keywords = [...e.keywords].map(String).sort();
                }
            }
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
                    // The row's MEMBERSHIP moves with the count. Without this the card stays in
                    // the losing seat's `resources` and never joins the winner's, and since every
                    // keyframe now carries `resources` the gate reports a mismatch on BOTH seats
                    // for the rest of the game.
                    removeOne(resourceList(fromPs), e.card);
                    addOnce(resourceList(ps), e.card);
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
            // captor now holds it: a unit in its `captured`, a base (Arrest) in its seat's
            // `baseCaptured`, created on first use like `baseUpgrades`.
            removeFromArenas(s, e.card);
            const baseSeat = typeof e.by === 'string' ? seatOfBaseRef(e.by) : null;
            const holder = baseSeat != null ? player(s, baseSeat) : undefined;
            if (holder) {
                if (!Array.isArray(holder.baseCaptured)) {
                    holder.baseCaptured = [];
                }
                addOnce(holder.baseCaptured, e.card);
                break;
            }
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
            // Arena zones only. An `upgrade` token attaches and is never an arena card, and a
            // token named in any other zone is not in play yet -- placing it would put a card in
            // `cards[]` with a non-arena zone, which no keyframe agrees with. Its MOVE into the
            // arena is what puts it in play, exactly as for a printed card (§12.1 step 3).
            if (e.kind !== 'upgrade' && ARENA_ZONES.has(e.zone)) {
                placeCard(s, e.p, e.token, e.zone);
            }
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
            // A base: it is nobody's attachment and in no list; it is defeated, which its HP
            // need not show (an ability can defeat a base outright).
            const baseSeat = seatOfBaseRef(e.card);
            if (baseSeat != null) {
                const ps = player(s, baseSeat);
                if (ps) {
                    ps.baseDefeated = true;
                }
                break;
            }
            // A defeated card stops being anyone's upgrade or captive, whether or not it was
            // ever an arena card of its own (an upgrade never is) -- and that includes a base's.
            detach(s, e.card);
            detachFromBases(s, e.card);
            for (const seat of [1, 2] as Seat[]) {
                const ps = s.players[seat];
                if (!ps) {
                    continue;
                }
                const idx = ps.cards.findIndex((c) => c.id === e.card);
                if (idx >= 0) {
                    // Idempotent: in a real stream the MOVE to discard already filed it and
                    // already took it out of `cards`, so this finds nothing. It still runs for
                    // a fold driven by DEFEAT with no paired MOVE (unit-level tests).
                    addOnce(ps.discard, ps.cards[idx].id);
                    ps.cards.splice(idx, 1);
                }
            }
            break;
        }
        case 'EXHAUST': setExhausted(s, e.card, true); break;
        case 'READY': setExhausted(s, e.card, false); break;
        // MOVE is the single source of truth for handSize/resourcesReady and arena
        // membership (see applyMoveCounts). DRAW/DISCARD/RESOURCE no longer mutate those
        // counts — they coincide with the underlying MOVEs and would double-count.
        case 'MOVE': applyMoveCounts(s, e); break;
        // DRAW/DISCARD add once by id: the paired MOVEs already added them, and double-adding
        // produced duplicate ids (and duplicate React keys) when a card was drawn, played and
        // drawn again. Mirrors upstream.
        case 'DRAW': {
            const ps = player(s, e.p);
            if (ps) for (const c of arr<string>(e.cards)) addOnce(ps.hand, c);
            break;
        }
        case 'DISCARD': {
            const ps = player(s, e.p);
            if (ps) for (const c of arr<string>(e.cards)) addOnce(ps.discard, c);
            break;
        }
        case 'RESOURCE': break;
        case 'SHIELD_GAIN': { const c = findCard(s, e.card); if (c) {
            c.shields += countOr(e.count, 1);
        } break; }
        case 'SHIELD_USE': { const c = findCard(s, e.card); if (c) {
            c.shields = Math.max(0, c.shields - countOr(e.count, 1));
        } break; }
        // `count` may be negative: a token leaving its host is recorded as the same event with a
        // negative delta (see SwuPgnRecorder.tokenRecord). Counts clamp at 0, and a status token
        // that reaches 0 is DELETED rather than left as `{advantage: 0}` — an engine keyframe
        // reports a host with no tokens as `statusTokens: {}`, and the integrity gate compares
        // the two by JSON equality.
        case 'EXPERIENCE_GAIN': { const c = findCard(s, e.card); if (c) {
            c.experience = Math.max(0, c.experience + countOr(e.count, 0));
        } break; }
        case 'STATUS_TOKEN': {
            const c = findCard(s, e.card);
            if (c && typeof e.token === 'string') {
                // Updated in place, on own keys only: the token name comes from the file, so it
                // must never read or write an inherited property, and copying the whole map per
                // record made a file with many token names fold in quadratic time.
                const tokens = c.statusTokens;
                const held = Object.prototype.hasOwnProperty.call(tokens, e.token);
                const next = Math.max(0, (held ? tokens[e.token] : 0) + countOr(e.count, 0));
                if (next > 0 && (held || Object.keys(tokens).length < MAX_ZONE_LIST)) {
                    Object.defineProperty(tokens, e.token, { value: next, enumerable: true, writable: true, configurable: true });
                } else if (held && next === 0) {
                    Reflect.deleteProperty(tokens, e.token);
                }
            }
            break;
        }
        // Pure-log events with no state delta:
        case 'ATTACK': case 'PASS': case 'CHOICE': case 'MULLIGAN':
        case 'KEEP_HAND': case 'MODAL_CHOICE': case 'SHUFFLE':
        case 'SEARCH': case 'REVEAL':
        case 'TRIGGER': case 'PHASE_END': case 'ROUND_END': case 'GAME_END':
        // UNDO is a note ABOUT the file, not an event in the game: the records it retracted were
        // removed, so there is nothing left to undo when folding.
        case 'UNDO':
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
        keywords: Array.isArray(r.keywords) ? r.keywords.slice(0, MAX_KEYFRAME_LIST).map(String) : undefined,
    };
}

/** CLIENT-OWNED. A keyframe's leader status, or nothing when it is not an object. */
function normalizeLeader(l: unknown): PlayerState['leader'] {
    if (l == null || typeof l !== 'object') return undefined;
    const r = l as Partial<NonNullable<PlayerState['leader']>>;
    return {
        id: String(r.id), deployed: r.deployed === true, exhausted: r.exhausted === true,
        epicActionUsed: r.epicActionUsed === true,
        // Only a double-sided leader carries a face. Absent stays absent: `false` would mean
        // "on its back side", which is a different claim from "this leader has one side".
        ...(typeof r.onStartingSide === 'boolean' ? { onStartingSide: r.onStartingSide } : {}),
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
        deckSize: typeof r.deckSize === 'number' && Number.isFinite(r.deckSize) ? r.deckSize : undefined,
        leader: normalizeLeader(r.leader),
        // Each of these stays ABSENT when the keyframe does not carry it -- absent is "not recorded",
        // and the gate only compares each when it is there. Written as explicit keys, not a
        // conditional spread, so a hostile non-array `resources` cannot ride through `...r`;
        // `undefined` is dropped by the clone below, which is what keeps absent absent.
        // `resources` is capped like every other keyframe list: the fold scans it on each
        // MOVE in and out of the row.
        resources: Array.isArray(r.resources) ? stringList(r.resources) : undefined,
        baseEpicActionUsed: typeof r.baseEpicActionUsed === 'boolean' ? r.baseEpicActionUsed : undefined,
        // Fortify upgrades and a base's captives (Arrest), on the same terms as `resources`.
        baseUpgrades: Array.isArray(r.baseUpgrades) ? stringList(r.baseUpgrades) : undefined,
        baseCaptured: Array.isArray(r.baseCaptured) ? stringList(r.baseCaptured) : undefined,
        // Written only when true (§11), so anything else is absent.
        baseDefeated: r.baseDefeated === true ? true : undefined,
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
            const snapped = normalizePlayer(seat, kp);
            // A keyframe that does not state the base's holdings has not recorded them (§11: absent
            // is "not recorded"), so what the records attached stays attached: a pilot file folds
            // Fortify from its MOVEs and states no `baseUpgrades` in its keyframes.
            const prior = s.players[seat];
            if (snapped.baseUpgrades === undefined && Array.isArray(prior?.baseUpgrades)) snapped.baseUpgrades = prior.baseUpgrades;
            if (snapped.baseCaptured === undefined && Array.isArray(prior?.baseCaptured)) snapped.baseCaptured = prior.baseCaptured;
            // A defeated base stays defeated: a writer may record DEFEAT base@N without restating it.
            if (prior?.baseDefeated === true) snapped.baseDefeated = true;
            players[seat] = snapped;
        }
    }
    const next = clone({
        round: kf.round, phase: kf.phase, initiative: kf.initiative,
        ...(typeof kf.initiativeTaken === 'boolean' ? { initiativeTaken: kf.initiativeTaken } : {}),
        // Keyframe-supplied and never derived (§11): the keyframe is the only authority on
        // whose turn it is, so one that states no seat clears the stale value rather than
        // carrying it past a round boundary. Guarded like every other seat the fold indexes by.
        ...(isSeat(kf.active) ? { active: kf.active } : {}),
        players,
    });
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
 * How much one frame costs foldFrames to keep: its serialized size, which is what the clone
 * copies. Counting only the known lists undercounts a keyframe's pass-through fields and a
 * card's statusTokens, and a light board's fixed per-seat overhead.
 */
function frameSize(s: ReducedState): number {
    return JSON.stringify(s).length;
}

/**
 * CLIENT-OWNED: what foldFrames would hold for `events`, in serialized characters summed over
 * every frame, without holding it: one fold, each frame measured and dropped. Stops counting
 * past `budget`. Each list is capped, but a file can keep a wide board for many records (2000
 * arena cards, then 5000 PASSes, is a 400 KB file that cost 2.7 GB), so a viewer checks this
 * before it builds the frame table.
 */
export function frameCost(events: GameEvent[], budget = Infinity): number {
    let s = emptyState();
    let total = 0;
    for (let i = 0; i < events.length && total <= budget; i++) {
        s = foldRange(events, i, i, s);
        total += frameSize(s);
    }
    return total;
}

/**
 * CLIENT-OWNED: whether a keyframe states everything snapToKeyframe would otherwise carry over
 * from the fold before it: the base's holdings, and a base already defeated (`firstDefeat` is
 * the index of each seat's first base DEFEAT record). Only such a keyframe makes what came
 * before it disposable.
 */
function isSelfSufficientKeyframe(kf: ReducedState, at: number, firstDefeat: Partial<Record<Seat, number>>): boolean {
    return ([1, 2] as Seat[]).every((seat) => {
        const p = kf.players?.[seat];
        const defeatBefore = (firstDefeat[seat] ?? Infinity) < at;
        return Array.isArray(p?.baseUpgrades) && Array.isArray(p?.baseCaptured) && (!defeatBefore || p?.baseDefeated === true);
    });
}

/**
 * Fold up to and including `seq`; the same state `fold()` and `foldFrames()` reach there.
 *
 * Starts from the last usable keyframe at or before `seq` rather than from the beginning, since
 * a replay scrubber calls this once per position and a full scrub was O(n^2). A keyframe that
 * does not state the base's holdings (a pilot file), or does not restate a base defeated before
 * it, does not make the past disposable: the snap keeps what the records established, so the
 * fold starts further back, or from the beginning.
 */
export function stateAt(events: GameEvent[], seq: string): ReducedState {
    const idx = events.findIndex((e) => e?.seq === seq);
    // An unknown seq folds the whole list. That is the DOCUMENTED contract (spec §12.3).
    const end = idx >= 0 ? idx : events.length - 1;
    // Where each seat's base was first defeated: by a DEFEAT record, or by a keyframe stating it
    // (snapToKeyframe carries either across a later keyframe that does not restate it).
    const firstDefeat: Partial<Record<Seat, number>> = {};
    for (let i = 0; i <= end; i++) {
        const e = events[i];
        if (e == null || typeof e !== 'object') continue;
        const seats: Seat[] = [];
        if (e.t === 'DEFEAT') {
            const seat = seatOfBaseRef(e.card);
            if (seat != null) seats.push(seat);
        } else if ((e.t === 'ROUND_START' || e.t === 'ROUND_END') && e.keyframe && typeof e.keyframe === 'object') {
            for (const seat of [1, 2] as Seat[]) if (e.keyframe.players?.[seat]?.baseDefeated === true) seats.push(seat);
        }
        for (const seat of seats) if (firstDefeat[seat] === undefined) firstDefeat[seat] = i;
    }
    for (let i = end; i >= 0; i--) {
        const e = events[i];
        if (e != null && typeof e === 'object' && hasSnapKeyframe(e) && isSelfSufficientKeyframe(e.keyframe, i, firstDefeat)) {
            return foldRange(events, i + 1, end, snapToKeyframe(emptyState(), e.keyframe));
        }
    }
    return foldRange(events, 0, end, emptyState());
}
