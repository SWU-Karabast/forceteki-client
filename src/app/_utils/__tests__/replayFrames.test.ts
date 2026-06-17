import { describe, it, expect } from 'vitest';
import { snapshotSeqs, eventsByFrame } from '../replayFrames';
import { parse } from '@/lib/swupgn';
import { readFileSync } from 'fs';
import path from 'path';

const SAMPLE = readFileSync(
    path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/sample-game.swupgn'),
    'utf-8',
);

describe('frame derivation', () => {
    const doc = parse(SAMPLE);

    it('derives one frame per event (every event is scrubable)', () => {
        const seqs = snapshotSeqs(doc.events);
        expect(seqs.length).toBe(doc.events.length);
        expect(seqs[0]).toBe(doc.events[0].seq);
    });

    it('buckets each event under its own frame index', () => {
        const buckets = eventsByFrame(doc.events);
        expect(buckets.length).toBe(doc.events.length);
        expect(buckets[3][0].seq).toBe(doc.events[3].seq);
    });
});
