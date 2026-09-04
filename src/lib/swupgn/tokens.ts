import type { CardKind, GameEvent } from './types';

const TOKEN_PREFIX = 'TOKEN:';
const FORCE_TOKEN_NAME = 'the force';

/** Tokens ride the stream as pseudo-cards prefixed `TOKEN:`. */
export const isTokenPseudoCard = (id: string): boolean => id.startsWith(TOKEN_PREFIX);

/**
 * The token's name, normalized, from either id shape forceteki has written:
 *   `TOKEN:advantage#5844562972`  (current: internal name + numeric art id)
 *   `TOKEN:Advantage:2`           (pre-2026-09: display name + copy suffix)
 * Both reduce to `advantage`. Files of both shapes are in the wild, so both are read.
 */
export const tokenName = (id: string): string =>
    id.slice(TOKEN_PREFIX.length).split('#')[0].replace(/:\d+$/, '').toLowerCase();

/** The numeric art id from a current-shape token id, if it carries one. */
export const tokenArtId = (id: string): string | undefined => {
    const art = id.slice(TOKEN_PREFIX.length).split('#')[1];
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
        if (!('card' in e) || !isStatusTokenCard(e.card)) {
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
 * Only inert MOVEs are dropped; every other record is kept, so `seq` lookups still resolve
 * and annotation references still land.
 */
export function dropInertRecords(events: GameEvent[]): GameEvent[] {
    return events.filter((e) => !(e.t === 'MOVE' && (!e.from || !e.to || e.from === e.to)));
}

/** Every stream repair the reader applies, in order. */
export function normalizeEvents(events: GameEvent[]): GameEvent[] {
    return dropInertRecords(normalizeTokenEvents(events));
}
