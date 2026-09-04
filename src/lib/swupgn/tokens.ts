import type { GameEvent } from './types';

const TOKEN_PREFIX = 'TOKEN:';
const FORCE_TOKEN = 'TOKEN:The Force';

/** Status tokens ride the stream as pseudo-cards named `TOKEN:<Name>[:copy]`. */
export const isTokenPseudoCard = (id: string): boolean => id.startsWith(TOKEN_PREFIX);

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
        if (!('card' in e) || !isTokenPseudoCard(e.card) || isForceToken(e.card)) {
            return e;
        }
        if (e.t !== 'MOVE') {
            return e;
        }
        if (e.to !== 'outsideTheGame') {
            const next = events[i + 1];
            if (next && next.t === 'STATUS_TOKEN' && next.count > 0) {
                bound.set(e.card, { card: next.card, token: next.token, count: next.count });
            }
            return e;
        }
        // Leaving play: emit the decrement in place of the (board-inert) move.
        const b = bound.get(e.card);
        if (!b) {
            return e;
        }
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
