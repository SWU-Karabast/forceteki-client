import { describe, it, expect } from 'vitest';
import { deckByFrame, initRecord } from '../deckTracker';
import { MAX_ZONE_LIST, type GameEvent, type SwuPgnDocument } from '@/lib/swupgn';

const doc = (order: string[]) => ({ setup: [{ seq: 'R1.S.0', t: 'INIT', p1DeckOrder: order, p2DeckOrder: [] }] } as unknown as SwuPgnDocument);
const mv = (seq: string, card: string, from: string, to: string): GameEvent => ({ seq, t: 'MOVE', card, from, to, p: 1 });

describe('deckByFrame', () => {
    it('consumes the INIT order as from:deck MOVEs arrive, index-aligned with events', () => {
        const out = deckByFrame(doc(['A', 'A:2', 'B']), [mv('1', 'A', 'deck', 'hand'), { seq: '2', t: 'PASS', p: 1 }, mv('3', 'A:2', 'deck', 'hand')]);
        expect(out.length).toBe(3);
        expect(out.at(3)).toBeUndefined();
        expect(out.at(0)![1].remaining).toEqual(['A:2', 'B']);
        expect(out.at(1)![1].remaining).toEqual(['A:2', 'B']);
        expect(out.at(2)![1].remaining).toEqual(['B']);
        expect(out.at(2)![2].remaining).toEqual([]);
    });

    it('a mulligan return goes to the end of the deck', () => {
        const out = deckByFrame(doc(['A', 'B']), [mv('1', 'A', 'deck', 'hand'), mv('2', 'A', 'hand', 'deck')]);
        expect(out.at(1)![1].remaining).toEqual(['B', 'A']);
    });

    it('ignores a from:deck MOVE for a card the order never listed, and a deck->deck MOVE', () => {
        const out = deckByFrame(doc(['A']), [mv('1', 'ZZZ#1', 'deck', 'hand'), mv('2', 'A', 'deck', 'deck')]);
        expect(out.at(1)![1].remaining).toEqual(['A']);
    });

    it('reports an empty deck every frame when the file has no INIT record', () => {
        expect(initRecord({ setup: [] } as unknown as SwuPgnDocument)).toBeUndefined();
        const out = deckByFrame({ setup: [null, { t: 'MOVE' }] } as unknown as SwuPgnDocument, [mv('1', 'A', 'deck', 'hand')]);
        expect(out.at(0)![1].remaining).toEqual([]);
    });

    it('does not alias: an earlier frame is unchanged by later draws', () => {
        const out = deckByFrame(doc(['A', 'B']), [mv('1', 'A', 'deck', 'hand'), mv('2', 'B', 'deck', 'hand')]);
        expect(out.at(0)![1].remaining).toEqual(['B']);
        expect(out.at(1)![1].remaining).toEqual([]);
    });

    it('survives an untyped seat or card on the MOVE', () => {
        const out = deckByFrame(doc(['A']), [{ seq: '1', t: 'MOVE', card: 5, from: 'deck', to: 'hand', p: '1' } as unknown as GameEvent, null as unknown as GameEvent]);
        expect(out.at(1)![1].remaining).toEqual(['A']);
    });
});

describe('deckByFrame on a hostile deck order', () => {
    // Value: protects=an uploaded INIT deck order longer than any real deck is capped, so per-frame copies stay small; fails_when=initOrder copies the file's list uncapped again (O(events x length) memory hangs the tab); why_new=ship review found the order unbounded while the fold caps its own lists; seam=none; no_claim=wall-clock or memory measurement
    it('caps each seat\'s deck order at MAX_ZONE_LIST', () => {
        const huge = Array.from({ length: MAX_ZONE_LIST + 500 }, (_, i) => `SOR#${i}`);
        const out = deckByFrame(doc(huge), [mv('1', 'SOR#0', 'deck', 'hand')]);
        expect(out.at(0)![1].remaining).toHaveLength(MAX_ZONE_LIST - 1);
        expect(out.at(0)![1].remaining[0]).toBe('SOR#1');
    });
});

describe('deckByFrame after a SHUFFLE', () => {
    // Value: protects=the Deck tab never presents a guessed order as the next draws; fails_when=SHUFFLE stops clearing `ordered`; why_new=Codex adversarial found 19/41, 2/36 and 8/20 fixture draws mispredicted, every one after a SHUFFLE; seam=none; no_claim=where the shuffled cards are
    it('keeps the cards but marks the order unknown, for that seat only', () => {
        const out = deckByFrame(doc(['A', 'B', 'C']), [mv('1', 'A', 'deck', 'hand'), { seq: '2', t: 'SHUFFLE', p: 1 }, mv('3', 'C', 'deck', 'hand')]);
        expect(out.at(0)![1]).toEqual({ remaining: ['B', 'C'], ordered: true });
        expect(out.at(1)![1].ordered).toBe(false);
        expect(out.at(2)![1]).toEqual({ remaining: ['B'], ordered: false });
        expect(out.at(2)![2].ordered).toBe(true);
    });
});

describe('deckByFrame lookups across checkpoints', () => {
    // Value: protects=a lookup replayed from a snapshot equals the state walked frame by frame; fails_when=the checkpoint index or replay range is off by one; why_new=the timeline replaced a per-frame copy; seam=none; no_claim=memory measurement
    it('matches a frame-by-frame walk on every frame of a long stream, and returns a copy', () => {
        const order = Array.from({ length: 60 }, (_, i) => `SOR#${i}`);
        const events: GameEvent[] = [];
        for (let i = 0; i < 300; i++) {
            events.push(i % 3 === 2 ? mv(`${i}`, `SOR#${i % 60}`, 'hand', 'deck') : mv(`${i}`, `SOR#${i % 60}`, 'deck', 'hand'));
        }
        const out = deckByFrame(doc(order), events);
        let walked: string[] = [...order];
        for (let i = 0; i < events.length; i++) {
            walked = deckByFrame(doc(walked), [events[i]]).at(0)![1].remaining;
            expect(out.at(i)![1].remaining, `frame ${i}`).toEqual(walked);
        }
        out.at(5)![1].remaining.length = 0;
        expect(out.at(5)![1].remaining.length).toBeGreaterThan(0);
    });

    // Value: protects=cards put back into a deck cannot grow it past MAX_ZONE_LIST; fails_when=the append path loses its cap; why_new=ship review found the append path uncapped; seam=none; no_claim=wall-clock
    it('caps cards put back at MAX_ZONE_LIST', () => {
        const back = Array.from({ length: MAX_ZONE_LIST + 10 }, (_, i) => mv(`${i}`, `NEW#${i}`, 'hand', 'deck'));
        const out = deckByFrame(doc([]), back);
        expect(out.at(back.length - 1)![1].remaining).toHaveLength(MAX_ZONE_LIST);
    });
});
