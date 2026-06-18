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
    it('toAnnotation replaces the client _id with a stable serialized id (for threading)', () => {
        const w: WorkingAnnotation = { _id: 'abc', ref: 'R1.P1.2', nag: '!', text: 'nice', by: 'Me' };
        expect(toAnnotation(w)).toEqual({ ref: 'R1.P1.2', nag: '!', text: 'nice', by: 'Me', id: 'abc' });
        expect('_id' in toAnnotation(w)).toBe(false);
    });

    it('working notes (incl. threaded replies) survive serialize -> parse', () => {
        const doc = parse(SAMPLE);
        const ref = doc.events[3].seq;
        const working: WorkingAnnotation[] = [
            { _id: '1', ref, nag: '!!', text: 'great line', by: 'Coach', ts: 100 },
            { _id: '2', ref, text: 'reply, no glyph', by: 'Student', parent: '1', ts: 200 },
        ];
        const reparsed = parse(serialize(mergeForExport(doc, working)));
        expect(reparsed.annotations).toContainEqual({ ref, nag: '!!', text: 'great line', by: 'Coach', ts: 100, id: '1' });
        // the reply keeps its parent link so the thread reconstructs from a shared file
        expect(reparsed.annotations).toContainEqual({ ref, text: 'reply, no glyph', by: 'Student', parent: '1', ts: 200, id: '2' });
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
