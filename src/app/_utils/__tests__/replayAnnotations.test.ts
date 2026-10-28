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

describe('replayAnnotations — what the client writes as an Annotator (§15, §23)', () => {
    // Value: protects=a note's text and author go out in NFC, so two notes that look the same compare the same; fails_when=toAnnotation stops normalizing; why_new=§15 SHOULD; seam=none; no_claim=notes the file already carried
    it('writes text and by in Unicode NFC', () => {
        const decomposed = 'Pade\u0301 cafe\u0301';
        const a = toAnnotation({ _id: '1', ref: 'R1.A.1', text: decomposed, by: 'Jose\u0301' });
        expect(a.text).toBe('Pad\u00e9 caf\u00e9');
        expect(a.by).toBe('Jos\u00e9');
        expect(a.text).toBe(a.text!.normalize('NFC'));
    });

    // Value: protects=an exported file parses again even when a stored note carries a what-if line with a reserved status token; fails_when=toAnnotation spreads the stored record again; why_new=parse now refuses a reserved token in an annotation line; seam=none; no_claim=what-if lines the file itself carried
    it('never writes a what-if line or a stray field, so the export always parses again', () => {
        const doc = parse(SAMPLE);
        const ref = doc.events[0].seq;
        const stored = { _id: 'w', ref, text: 'what if', line: [{ seq: ref, t: 'STATUS_TOKEN', card: 'SOR#108', token: '__proto__', count: 1 }], x: 1 } as unknown as WorkingAnnotation;
        const out = serialize(mergeForExport(doc, [stored]));
        const reparsed = parse(out);
        expect(reparsed.annotations.at(-1)).toEqual({ ref, text: 'what if', id: 'w' });
        expect(out).not.toMatch(/"line":|"x":1/);
    });
});
