import type { GameEvent, Seat, SetupInitRecord, SwuPgnDocument } from '@/lib/swupgn';

/**
 * What is still in a player's deck at a given frame, in order.
 *
 * The file publishes the full starting deck order (`INIT.p1DeckOrder` / `p2DeckOrder`), so
 * unlike a live game the remaining deck is knowable exactly — including what is coming next.
 * That is the difference between "you drew badly" and "the card you needed was two down and
 * you resourced the one that would have found it", which is the whole point of reviewing.
 *
 * A card leaves the deck when a MOVE takes it out (`from: 'deck'`) and returns when one puts
 * it back. Order is preserved from the INIT list; a card put back goes to the end, since the
 * stream does not say where in the deck it landed.
 */
export interface DeckState {

    /** Remaining card ids, in draw order — index 0 is the next card. */
    remaining: string[];

    /** Ids that have left the deck, in the order they left. */
    gone: string[];
}

function initOrder(doc: SwuPgnDocument): Record<Seat, string[]> {
    const init = doc.setup.find((r): r is SetupInitRecord => !!r && (r as SetupInitRecord).t === 'INIT');
    return {
        1: Array.isArray(init?.p1DeckOrder) ? [...init.p1DeckOrder] : [],
        2: Array.isArray(init?.p2DeckOrder) ? [...init.p2DeckOrder] : [],
    };
}

/** Deck state per seat after each frame. Index matches the repaired event array. */
export function deckByFrame(doc: SwuPgnDocument, events: GameEvent[]): Array<Record<Seat, DeckState>> {
    const order = initOrder(doc);
    const cur: Record<Seat, string[]> = { 1: [...order[1]], 2: [...order[2]] };
    const gone: Record<Seat, string[]> = { 1: [], 2: [] };
    const out: Array<Record<Seat, DeckState>> = new Array(events.length);

    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e != null && typeof e === 'object' && e.t === 'MOVE' && (e.p === 1 || e.p === 2)) {
            if (e.from === 'deck' && e.to !== 'deck') {
                const idx = cur[e.p].indexOf(e.card);
                if (idx >= 0) {
                    cur[e.p] = [...cur[e.p].slice(0, idx), ...cur[e.p].slice(idx + 1)];
                    gone[e.p] = [...gone[e.p], e.card];
                }
            } else if (e.to === 'deck' && e.from !== 'deck' && !cur[e.p].includes(e.card)) {
                // The stream doesn't say where in the deck it went; the end is the honest guess.
                cur[e.p] = [...cur[e.p], e.card];
                gone[e.p] = gone[e.p].filter((c) => c !== e.card);
            }
        }
        out[i] = { 1: { remaining: cur[1], gone: gone[1] }, 2: { remaining: cur[2], gone: gone[2] } };
    }
    return out;
}
