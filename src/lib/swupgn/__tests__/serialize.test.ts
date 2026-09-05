import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '../parse';
import { serialize } from '../serialize';
import { render } from '../render';
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

    it('renders a STORY and emits CARDS in spec order when the source had neither', () => {
        const doc = parse(SAMPLE);
        const text = serialize({ ...doc, story: undefined, cards: undefined });
        const idx = (s: string) => text.indexOf(`%%% ${s}`);
        expect(idx('STORY')).toBeGreaterThan(-1);
        expect(idx('STORY')).toBeLessThan(idx('DECKS'));
        expect(idx('DECKS')).toBeLessThan(idx('CARDS'));
        expect(idx('CARDS')).toBeLessThan(idx('SETUP'));
        expect(idx('SETUP')).toBeLessThan(idx('EVENTS'));
        expect(parse(text).story!.join('\n')).toBe(render(doc).replace(/^\n+|\n+$/g, ''));
    });

    it('emits an existing story verbatim instead of re-rendering it', () => {
        const doc = { ...parse(SAMPLE), story: ['hand-written line'] };
        expect(parse(serialize(doc)).story).toEqual(['hand-written line']);
    });

    it('round-trips appended annotations (needed for sharing)', () => {
        const doc = parse(SAMPLE);
        const note: Annotation = { ref: doc.events[5].seq, nag: '?', text: 'misplay', by: 'Coach' };
        const withNote = { ...doc, annotations: [...doc.annotations, note] };
        const reparsed = parse(serialize(withNote));
        expect(reparsed.annotations).toContainEqual(note);
    });
});
