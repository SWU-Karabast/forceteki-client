import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, normalizeEvents } from '@/lib/swupgn';
import { buildBeats } from '../replayBeats';
import { clipBeats } from '../exportClipWebm';

// clipBeats is the pure slice of exportClipWebm's frame loop (the rest is MediaRecorder,
// browser-only); this is what keeps the loop's beat selection honest.
const doc = parse(readFileSync(join(__dirname, '../../../lib/swupgn/__tests__/fixtures/game-463c3022.swupgn'), 'utf8'));
const events = normalizeEvents(doc.events, new Set());
const beats = buildBeats(events);

describe('clipBeats', () => {
    it('a clip over whole beats 7..12 yields exactly beats 7..12', () => {
        const lo = beats[7].start, hi = beats[12].end;
        expect(clipBeats(beats, lo, hi).map((b) => b.index)).toEqual([7, 8, 9, 10, 11, 12]);
    });

    it('a clip starting mid-beat still counts that beat once', () => {
        const b = beats.find((x) => x.end > x.start);
        expect(b).toBeDefined();
        expect(clipBeats(beats, b!.start + 1, b!.end)).toEqual([b]);
    });
});
