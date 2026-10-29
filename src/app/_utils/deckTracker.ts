import { MAX_ZONE_LIST, type GameEvent, type Seat, type SetupInitRecord, type SwuPgnDocument } from '@/lib/swupgn';

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
 * stream does not say where in the deck it landed. A SHUFFLE keeps the cards but loses the
 * order: the record names the seat, not the new order, so from then on only the contents are
 * exact.
 */
export interface DeckState {

    /** Remaining card ids. In draw order (index 0 is the next card) only while `ordered`. */
    remaining: string[];

    /** False once the deck has been shuffled: `remaining` is then the right cards in no known order. */
    ordered: boolean;
}

type Decks = Record<Seat, DeckState>;

/** The INIT setup record, if the file carries one. The one lookup every deck reader shares. */
export function initRecord(doc: SwuPgnDocument): SetupInitRecord | undefined {
    return doc.setup.find((r): r is SetupInitRecord => !!r && (r as SetupInitRecord).t === 'INIT');
}

// The deck order comes from the file; a real deck is about 50 cards. The fold caps its own
// lists at the same MAX_ZONE_LIST, and so does every card put back.
function initOrder(doc: SwuPgnDocument): Decks {
    const init = initRecord(doc);
    return {
        1: { remaining: Array.isArray(init?.p1DeckOrder) ? init.p1DeckOrder.slice(0, MAX_ZONE_LIST) : [], ordered: true },
        2: { remaining: Array.isArray(init?.p2DeckOrder) ? init.p2DeckOrder.slice(0, MAX_ZONE_LIST) : [], ordered: true },
    };
}

const copy = (d: Decks): Decks => ({ 1: { ...d[1], remaining: [...d[1].remaining] }, 2: { ...d[2], remaining: [...d[2].remaining] } });

/** Apply one event to a working copy, in place. */
function step(cur: Decks, e: GameEvent): void {
    if (e == null || typeof e !== 'object') return;
    const p = (e as { p?: unknown }).p;
    if (p !== 1 && p !== 2) return;
    const deck = cur[p];
    if (e.t === 'SHUFFLE') {
        deck.ordered = false;
    } else if (e.t === 'MOVE' && typeof e.card === 'string') {
        if (e.from === 'deck' && e.to !== 'deck') {
            const idx = deck.remaining.indexOf(e.card);
            if (idx >= 0) deck.remaining.splice(idx, 1);
        } else if (e.to === 'deck' && e.from !== 'deck' && deck.remaining.length < MAX_ZONE_LIST && !deck.remaining.includes(e.card)) {
            // The stream doesn't say where in the deck it went; the end is the honest guess,
            // so the draw order is no longer known.
            deck.remaining.push(e.card);
            deck.ordered = false;
        }
    }
}

// One snapshot per this many frames. A copy per frame costs events x deck length, which a
// hostile file (200k events, a 1,000-card order) runs to gigabytes; a lookup replays at most
// CHECKPOINT_EVERY - 1 events from the snapshot before it.
const CHECKPOINT_EVERY = 128;

/** Deck state per seat after each frame, looked up by frame. Index matches the repaired event array. */
export class DeckTimeline {
    readonly length: number;
    private readonly events: GameEvent[];
    private readonly checkpoints: Decks[];

    constructor(start: Decks, events: GameEvent[]) {
        this.length = events.length;
        this.events = events;
        this.checkpoints = [];
        const cur = copy(start);
        for (let i = 0; i < events.length; i++) {
            if (i % CHECKPOINT_EVERY === 0) this.checkpoints.push(copy(cur));
            step(cur, events[i]);
        }
    }

    /** The decks after frame `i`, or undefined outside the replay. A fresh copy: callers may keep it. */
    at(i: number): Decks | undefined {
        if (!Number.isInteger(i) || i < 0 || i >= this.length) return undefined;
        const k = Math.floor(i / CHECKPOINT_EVERY);
        const cur = copy(this.checkpoints[k]);
        for (let j = k * CHECKPOINT_EVERY; j <= i; j++) step(cur, this.events[j]);
        return cur;
    }
}

export function deckByFrame(doc: SwuPgnDocument, events: GameEvent[]): DeckTimeline {
    return new DeckTimeline(initOrder(doc), events);
}
