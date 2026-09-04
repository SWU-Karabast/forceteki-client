import type { CardKind, GameEvent, ReducedState } from './types';

const TOKEN_PREFIX = 'TOKEN:';
const FORCE_TOKEN_NAME = 'the force';

/**
 * Tokens ride the stream as pseudo-cards prefixed `TOKEN:`.
 *
 * Every helper here coerces with String() first. These read fields straight off
 * JSON.parse of an uploaded file, where nothing guarantees a string — a `card` that
 * arrives as a number would otherwise throw `id.startsWith is not a function` and take
 * the whole replay down. `baseId` in cardNames.ts guards the same way.
 */
export const isTokenPseudoCard = (id: string): boolean => String(id).startsWith(TOKEN_PREFIX);

/**
 * The token's name, normalized, from either id shape forceteki has written:
 *   `TOKEN:advantage#5844562972`  (current: internal name + numeric art id)
 *   `TOKEN:Advantage:2`           (pre-2026-09: display name + copy suffix)
 * Both reduce to `advantage`. Files of both shapes are in the wild, so both are read.
 */
export const tokenName = (id: string): string =>
    String(id).slice(TOKEN_PREFIX.length).split('#')[0].replace(/:\d+$/, '').toLowerCase();

/**
 * The numeric art id from a current-shape token id, if it carries one.
 * A second copy of a token appends its suffix AFTER the art id —
 * `TOKEN:advantage#5844562972:2` — so the suffix is stripped before the numeric test.
 */
export const tokenArtId = (id: string): string | undefined => {
    const art = String(id).slice(TOKEN_PREFIX.length).split('#')[1]?.replace(/:\d+$/, '');
    return art && /^\d+$/.test(art) ? art : undefined;
};

/**
 * Pre-1.0 FALLBACK ONLY.
 *
 * A current file states `kind: 'unit' | 'upgrade'` on `MOVE`, `CREATE_TOKEN` and every
 * `%%% CARDS` entry, derived from the card's type — so a token upgrade printed next year
 * classifies itself and this list is never consulted. It exists solely for 1.1 files, which
 * carry no `kind` and in which a token upgrade is otherwise indistinguishable from a token
 * unit: both arrive as `TOKEN:<name>`. Getting it wrong folds an upgrade into an arena as a
 * card with no printed identity, or strands a defeated token unit there forever.
 *
 * Do not add to this list to support a new token. Fix the emitter to state `kind`.
 */
const PRE_1_0_UPGRADE_NAMES = new Set(['shield', 'experience', 'advantage', 'weakness']);

/**
 * Is this record a token upgrade? `kind` decides when the record carries it; the name list
 * is consulted only for a pre-1.0 file that states nothing.
 */
export const isStatusTokenCard = (id: string, kind?: CardKind): boolean => {
    if (!isTokenPseudoCard(id)) {
        return false;
    }
    if (kind) {
        return kind === 'upgrade';
    }
    return PRE_1_0_UPGRADE_NAMES.has(tokenName(id));
};

/** The Force is a per-player token that sits on the base, not a unit status token. */
export const isForceToken = (id: string): boolean =>
    isTokenPseudoCard(id) && tokenName(id) === FORCE_TOKEN_NAME;

/**
 * Repair the token lifecycle in a forceteki event stream.
 *
 * A unit's status token is emitted as a pseudo-card: gaining it is a
 * `MOVE TOKEN:<Name>[:copy] outsideTheGame -> <arena>` immediately followed by the host's
 * `STATUS_TOKEN ... count: +n`; losing it is a `MOVE ... -> outsideTheGame` plus a
 * `DEFEAT`, with NO matching decrement anywhere. Read literally, every token a game grants
 * sticks to its host for the rest of the replay — in a sample 7-round game all six
 * Advantage tokens were removed in play and all six badges would have stayed on the board.
 *
 * The stream binds a token to its host only by that gain adjacency, so recover the binding
 * on the way in and rewrite the removal into the decrement the file should have carried.
 * The `seq` is preserved, so this is a one-for-one rewrite: annotation references and
 * frame indices still line up.
 */
export function normalizeTokenEvents(events: GameEvent[]): GameEvent[] {
    const bound = new Map<string, { card: string; token: string; count: number }>();
    return events.map((e, i) => {
        if (e == null || typeof e !== 'object') {
            return e;
        }
        if (!('card' in e) || !isStatusTokenCard(e.card, 'kind' in e ? e.kind : undefined)) {
            return e;
        }
        if (e.t !== 'MOVE') {
            return e;
        }
        if (e.to !== 'outsideTheGame') {
            // `attachedTo` is the normative host binding; the adjacent STATUS_TOKEN is the
            // fallback for files written before forceteki carried it. Either way the token's
            // name and count come from that STATUS_TOKEN, which is the only place they appear.
            const next = events[i + 1];
            if (next && next.t === 'STATUS_TOKEN' && next.count > 0) {
                bound.set(e.card, { card: e.attachedTo ?? next.card, token: next.token, count: next.count });
            }
            return e;
        }
        // Leaving play: emit the decrement in place of the (board-inert) move.
        const prior = bound.get(e.card);
        if (!prior) {
            return e;
        }
        const b = { ...prior, card: e.attachedTo ?? prior.card };
        bound.delete(e.card);
        // Forward-compatible with a fixed emitter: if the stream already decrements the
        // host nearby, leave its events alone rather than removing the token twice.
        const emitted = events.slice(i + 1, i + 4).some(
            (n) => n.t === 'STATUS_TOKEN' && n.card === b.card && n.token === b.token && n.count < 0,
        );
        if (emitted) {
            return e;
        }
        return { seq: e.seq, t: 'STATUS_TOKEN', card: b.card, token: b.token, count: -b.count };
    });
}

/**
 * Drop records that describe nothing about the board.
 *
 * A deck search emits, per card examined, a `deck -> deck` MOVE and a second MOVE with an
 * EMPTY `from` — neither is a zone transition, and `from: ""` is not a legal zone at all.
 * In a sample game two searches produced 28 of the file's 136 MOVE records (20%), each one
 * costing the scrubber a frame that renders identically to its neighbour.
 *
 * Dropping a record removes its `seq` from the stream, so anything anchored to it — an
 * annotation ref, a shared `?t=` link — would resolve to nothing. `keepSeqs` holds those
 * back: a referenced record stays, and playback skips it anyway because the board does not
 * change across it. The 1.0 writer no longer emits inert MOVEs at all, so this is a
 * legacy-file repair.
 */
export function dropInertRecords(events: GameEvent[], keepSeqs: ReadonlySet<string> = new Set()): GameEvent[] {
    return events.filter((e) => !(e != null && typeof e === 'object'
        && e.t === 'MOVE' && (!e.from || !e.to || e.from === e.to)
        && !keepSeqs.has(e.seq)));
}

/**
 * Every stream repair the reader applies, in order.
 *
 * Never returns an empty array for a non-empty input: a file whose every record is inert
 * would otherwise leave the viewer with zero frames and a spinner that never resolves.
 */
export function normalizeEvents(events: GameEvent[], keepSeqs?: ReadonlySet<string>): GameEvent[] {
    const repaired = dropInertRecords(normalizeTokenEvents(repairUpgradePlays(events)), keepSeqs);
    return repaired.length > 0 ? repaired : events;
}

/**
 * Recover the host of an upgrade the writer played without naming one.
 *
 * `PLAY_UPGRADE` carries no `target` and the paired `MOVE` carries no `attachedTo`, so an
 * upgrade has nowhere to attach and is dropped — a played Ascension Cable simply never
 * appears. Worse for a PILOT: `kind` describes the card's PRINTED type, not the role it is
 * taking, so Han Solo (a ground unit played as an upgrade onto a vehicle) arrives as
 * `MOVE ... to: "space", kind: "unit"` and lands in the SPACE arena as a standalone ground
 * unit next to the vehicle he is flying.
 *
 * The keyframes know the answer — they record `upgrades: ["JTL#203"]` on the host — so
 * harvest that mapping and apply it to the events:
 *   - a target-less `PLAY_UPGRADE` gets its `target`, so the fold attaches it;
 *   - the `MOVE` that puts the card in an arena immediately before it is re-marked
 *     `kind: 'upgrade'`, which is the writer's own signal for "this is not an arena card".
 */
export function repairUpgradePlays(events: GameEvent[]): GameEvent[] {
    const hostOf = new Map<string, string>();
    for (const e of events) {
        if (e == null || typeof e !== 'object') continue;
        const kf = (e as { keyframe?: ReducedState }).keyframe;
        if (!kf) continue;
        for (const ps of Object.values(kf.players ?? {})) {
            for (const c of ps?.cards ?? []) {
                for (const u of c?.upgrades ?? []) hostOf.set(u, c.id);
            }
        }
    }
    if (hostOf.size === 0) return events;

    const playedAsUpgrade = new Set<string>();
    for (const e of events) {
        if (e != null && typeof e === 'object' && e.t === 'PLAY_UPGRADE') playedAsUpgrade.add(e.card);
    }

    return events.map((e, i) => {
        if (e == null || typeof e !== 'object') return e;
        if (e.t === 'PLAY_UPGRADE' && !e.target) {
            const host = hostOf.get(e.card);
            return host ? { ...e, target: host } : e;
        }
        if (e.t === 'MOVE' && e.kind !== 'upgrade' && playedAsUpgrade.has(e.card)) {
            const next = events[i + 1];
            const isThePlay = next != null && typeof next === 'object'
                && next.t === 'PLAY_UPGRADE' && next.card === e.card;
            if (isThePlay) return { ...e, kind: 'upgrade' as const };
        }
        return e;
    });
}
