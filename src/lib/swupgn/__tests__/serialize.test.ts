import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '../parse';
import { serialize } from '../serialize';
import type { Annotation } from '../types';

const SAMPLE = readFileSync(
    path.join(__dirname, 'fixtures/sample-game.swupgn'),
    'utf-8',
);

describe('serialize ↔ parse round-trip', () => {
    it('re-parses to an equivalent document', () => {
        const doc = parse(SAMPLE);
        const reparsed = parse(serialize(doc));
        expect(reparsed.header).toEqual(doc.header);
        expect(reparsed.decks).toEqual(doc.decks);
        expect(reparsed.events).toEqual(doc.events);
        expect(reparsed.setup).toEqual(doc.setup);
    });

    it('round-trips appended annotations (needed for sharing)', () => {
        const doc = parse(SAMPLE);
        const note: Annotation = { ref: doc.events[5].seq, nag: '?', text: 'misplay', by: 'Coach' };
        const withNote = { ...doc, annotations: [...doc.annotations, note] };
        const reparsed = parse(serialize(withNote));
        expect(reparsed.annotations).toContainEqual(note);
    });
});
