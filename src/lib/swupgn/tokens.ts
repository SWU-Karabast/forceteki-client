import type { GameEvent } from './types';

const TOKEN_PREFIX = 'TOKEN:';
const FORCE_TOKEN = 'TOKEN:The Force';

/** Tokens ride the stream as pseudo-cards named `TOKEN:<Name>[:copy]`. */
export const isTokenPseudoCard = (id: string): boolean => id.startsWith(TOKEN_PREFIX);

/** `TOKEN:Advantage:3` -> `Advantage`. */
export const tokenName = (id: string): string => id.slice(TOKEN_PREFIX.length).replace(/:\d+$/, '');

/**
 * Token UPGRADES — the ones that attach to a host unit and render as a count badge.
 * Token UNITS (Battle Droid, X-Wing, TIE Fighter, Clone Trooper, Mandalorian, Spy, Beast)
 * are ordinary board cards and MUST fold normally, or a defeated one is stranded in its
 * arena for the rest of the replay. forceteki types them `['token','upgrade']` vs
 * `['token','unit']`; the reader is engine-independent and has no card data, so the
 * upgrade set is enumerated here.
 */
const STATUS_TOKEN_NAMES = new Set(['Shield', 'Experience', 'Advantage', 'Weakness']);
export const isStatusTokenCard = (id: string): boolean =>
    isTokenPseudoCard(id) && STATUS_TOKEN_NAMES.has(tokenName(id));

/** The Force is a per-player token that sits on the base, not a unit status token. */
export const isForceToken = (id: string): boolean => id === FORCE_TOKEN;

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
