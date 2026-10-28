import { describe, it, expect } from 'vitest';
import { deckByFrame, initRecord } from '../deckTracker';
import { MAX_ZONE_LIST, type GameEvent, type SwuPgnDocument } from '@/lib/swupgn';

const doc = (order: string[]) => ({ setup: [{ seq: 'R1.S.0', t: 'INIT', p1DeckOrder: order, p2DeckOrder: [] }] } as unknown as SwuPgnDocument);
const mv = (seq: string, card: string, from: string, to: string): GameEvent => ({ seq, t: 'MOVE', card, from, to, p: 1 });

describe('deckByFrame', () => {
    it('consumes the INIT order as from:deck MOVEs arrive, index-aligned with events', () => {
        const out = deckByFrame(doc(['A', 'A:2', 'B']), [mv('1', 'A', 'deck', 'hand'), { seq: '2', t: 'PASS', p: 1 }, mv('3', 'A:2', 'deck', 'hand')]);
        expect(out).toHaveLength(3);
        expect(out[0][1].remaining).toEqual(['A:2', 'B']);
        expect(out[1][1].remaining).toEqual(['A:2', 'B']);
        expect(out[2][1].remaining).toEqual(['B']);
        expect(out[2][2].remaining).toEqual([]);
    });

    it('a mulligan return goes to the end of the deck', () => {
        const out = deckByFrame(doc(['A', 'B']), [mv('1', 'A', 'deck', 'hand'), mv('2', 'A', 'hand', 'deck')]);
        expect(out[1][1].remaining).toEqual(['B', 'A']);
    });

    it('ignores a from:deck MOVE for a card the order never listed, and a deck->deck shuffle', () => {
        const out = deckByFrame(doc(['A']), [mv('1', 'ZZZ#1', 'deck', 'hand'), mv('2', 'A', 'deck', 'deck')]);
        expect(out[1][1].remaining).toEqual(['A']);
    });

    it('reports an empty deck every frame when the file has no INIT record', () => {
        expect(initRecord({ setup: [] } as unknown as SwuPgnDocument)).toBeUndefined();
        const out = deckByFrame({ setup: [null, { t: 'MOVE' }] } as unknown as SwuPgnDocument, [mv('1', 'A', 'deck', 'hand')]);
        expect(out[0][1].remaining).toEqual([]);
    });

    it('does not alias: an earlier frame is unchanged by later draws', () => {
        const out = deckByFrame(doc(['A', 'B']), [mv('1', 'A', 'deck', 'hand'), mv('2', 'B', 'deck', 'hand')]);
        expect(out[0][1].remaining).toEqual(['B']);
        expect(out[1][1].remaining).toEqual([]);
    });

    it('survives an untyped seat or card on the MOVE', () => {
        const out = deckByFrame(doc(['A']), [{ seq: '1', t: 'MOVE', card: 5, from: 'deck', to: 'hand', p: '1' } as unknown as GameEvent, null as unknown as GameEvent]);
        expect(out[1][1].remaining).toEqual(['A']);
    });
});

describe('deckByFrame on a hostile deck order', () => {
    // Value: protects=an uploaded INIT deck order longer than any real deck is capped, so per-frame copies stay small; fails_when=initOrder copies the file's list uncapped again (O(events x length) memory hangs the tab); why_new=ship review found the order unbounded while the fold caps its own lists; seam=none; no_claim=wall-clock or memory measurement
    it('caps each seat\'s deck order at MAX_ZONE_LIST', () => {
        const huge = Array.from({ length: MAX_ZONE_LIST + 500 }, (_, i) => `SOR#${i}`);
        const out = deckByFrame(doc(huge), [mv('1', 'SOR#0', 'deck', 'hand')]);
        expect(out[0][1].remaining).toHaveLength(MAX_ZONE_LIST - 1);
        expect(out[0][1].remaining[0]).toBe('SOR#1');
    });
});
