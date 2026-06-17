import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, serialize } from '@/lib/swupgn';
import { mergeForExport, toAnnotation, type WorkingAnnotation } from '../replayAnnotations';

const SAMPLE = readFileSync(
    path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/sample-game.swupgn'),
    'utf-8',
);

describe('replayAnnotations merge/export', () => {
    it('toAnnotation strips the client-only _id', () => {
        const w: WorkingAnnotation = { _id: 'abc', ref: 'R1.P1.2', nag: '!', text: 'nice', by: 'Me' };
        expect(toAnnotation(w)).toEqual({ ref: 'R1.P1.2', nag: '!', text: 'nice', by: 'Me' });
        expect('_id' in toAnnotation(w)).toBe(false);
    });

    it('working notes survive serialize -> parse with by/nag/text intact', () => {
        const doc = parse(SAMPLE);
        const working: WorkingAnnotation[] = [
            { _id: '1', ref: doc.events[3].seq, nag: '!!', text: 'great line', by: 'Coach' },
            { _id: '2', ref: doc.events[3].seq, text: 'reply, no glyph', by: 'Student' },
        ];
        const reparsed = parse(serialize(mergeForExport(doc, working)));
        expect(reparsed.annotations).toContainEqual({ ref: doc.events[3].seq, nag: '!!', text: 'great line', by: 'Coach' });
        expect(reparsed.annotations).toContainEqual({ ref: doc.events[3].seq, text: 'reply, no glyph', by: 'Student' });
        // no client-only field leaked into the file
        expect(reparsed.annotations.some((a) => '_id' in a)).toBe(false);
    });

    it('appends working notes after existing file annotations', () => {
        const doc = parse(SAMPLE);
        const base = doc.annotations.length;
        const merged = mergeForExport(doc, [{ _id: 'x', ref: doc.events[0].seq, text: 'hi', by: 'Me' }]);
        expect(merged.annotations).toHaveLength(base + 1);
    });
});
