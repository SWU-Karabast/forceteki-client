import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse, fold, render, checkKeyframes, normalizeEvents, type ReducedState } from '../index';

/**
 * Spec §20: the test vectors under forceteki `swupgn/test-vectors/` are NORMATIVE. A reader
 * that does not reproduce `.fold.json` and `.render.txt` byte for byte is not conformant, no
 * matter what its own tests say. Copied verbatim from upstream; re-copy when upstream adds one.
 *
 * The fold runs over the REPAIRED stream (normalizeEvents), because that is what the viewer
 * folds. A conformant file needs no repair, so the two must agree on every vector.
 */
const DIR = path.join(__dirname, 'fixtures/vectors');
const VECTORS = readdirSync(DIR).filter((f) => f.endsWith('.swupgn')).map((f) => f.replace(/\.swupgn$/, ''));

describe.each(VECTORS)('test vector: %s', (name) => {
    const text = readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8');
    const doc = parse(text);

    it('folds to exactly .fold.json', () => {
        // Byte for byte, with no carve-out. `hand[]` and `discard[]` CONTENTS used to be the
        // one documented divergence — upstream only appended to them, the viewer renders them
        // and so had to remove a card that left. Upstream folds both from MOVE now (spec §12.1)
        // and gates them (§14), so the client's fold and the vector agree outright.
        const expected = JSON.parse(readFileSync(path.join(DIR, `${name}.fold.json`), 'utf-8')) as ReducedState;
        expect(fold(doc.events)).toEqual(expected);
        expect(fold(normalizeEvents(doc.events))).toEqual(expected);
    });

    it('renders to exactly .render.txt', () => {
        const expected = readFileSync(path.join(DIR, `${name}.render.txt`), 'utf-8');
        // The vector file ends with a newline; render() joins lines and adds none.
        expect(render(doc) + '\n').toBe(expected);
    });

    it('carries a %%% STORY that is its own render (spec §16)', () => {
        // parse() trims the blank LINES the banner spacing leaves at either edge, never the
        // leading space of the first line (` ── setup ──`).
        expect(doc.story!.join('\n')).toBe(render(doc).replace(/^\n+|\n+$/g, ''));
    });

    it('survives a serialize/parse round trip with every section intact, folding and rendering identically', async () => {
        const { serialize } = await import('../index');
        const text = serialize(doc);
        // Canonical section order (spec §4), STORY and CARDS included.
        expect(text.split('\n').filter((l) => l.startsWith('%%% ')))
            .toEqual(['%%% STORY', '%%% DECKS', '%%% CARDS', '%%% SETUP', '%%% EVENTS', '%%% ANNOTATIONS']);
        const again = parse(text);
        expect(again.events).toEqual(doc.events);
        expect(again.cards).toEqual(doc.cards);
        expect(again.story).toEqual(doc.story);
        expect(again.annotations).toEqual(doc.annotations);
        expect(again.header).toEqual(doc.header);
        expect(fold(again.events)).toEqual(fold(doc.events));
        expect(render(again)).toBe(render(doc));
        // Threaded annotation fields (spec §15) ride through untouched.
        const threaded = { ...doc, annotations: [...doc.annotations, { ref: doc.events[1].seq, text: 'reply', id: 'n2', parent: 'n1', ts: 1700000000000, by: 'p1' }] };
        expect(parse(serialize(threaded)).annotations).toEqual(threaded.annotations);
    });

    it('passes the §14 gate with no mismatch (spec §20 step 5)', () => {
        // Every vector is internally consistent, so a mismatch is a fold rule wrong here,
        // never a bad file. (Step 2, validate(), is asserted upstream on these same bytes;
        // the client does not ship the Node-only validator.)
        expect(checkKeyframes(doc.events).mismatches).toEqual([]);
        expect(checkKeyframes(normalizeEvents(doc.events)).mismatches).toEqual([]);
    });
});
