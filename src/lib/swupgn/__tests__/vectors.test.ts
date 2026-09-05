import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse, fold, render, checkKeyframes, normalizeEvents } from '../index';

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
        const expected = JSON.parse(readFileSync(path.join(DIR, `${name}.fold.json`), 'utf-8'));
        expect(fold(normalizeEvents(doc.events))).toEqual(expected);
        expect(fold(doc.events)).toEqual(expected);
    });

    it('renders to exactly .render.txt', () => {
        const expected = readFileSync(path.join(DIR, `${name}.render.txt`), 'utf-8');
        // The vector file ends with a newline; render() joins lines and adds none.
        expect(render(doc) + '\n').toBe(expected);
    });

    it('carries a %%% STORY that is its own render (spec §16)', () => {
        // parse() trims the blank lines the banner spacing leaves at either edge.
        expect(doc.story!.join('\n')).toBe(render(doc).trim());
    });

    it('survives a serialize/parse round trip with every section intact', async () => {
        const { serialize } = await import('../index');
        const again = parse(serialize(doc));
        expect(again.events).toEqual(doc.events);
        expect(again.cards).toEqual(doc.cards);
        expect(again.story).toEqual(doc.story);
        expect(again.annotations).toEqual(doc.annotations);
        expect(again.header).toEqual(doc.header);
    });

    it('is honest by the §14 gate everywhere the gate can look', () => {
        // The minimal vector opens on a keyframe with no setup events before it, so handSize
        // and resourcesReady have nothing to fold from and the first keyframe reports them.
        // §14 exempts only baseHp there; the vector is conformant by §20's four criteria
        // (parse, validate, fold, render), not by a clean gate. Pin what the gate says so a
        // change here is a decision, not an accident.
        const { mismatches } = checkKeyframes(doc.events);
        expect(mismatches.every((m) => m.seq === 'R1.start')).toBe(true);
        expect(mismatches.map((m) => m.path).sort()).toEqual([
            'players.1.handSize', 'players.1.resourcesReady',
            'players.2.handSize', 'players.2.resourcesReady',
        ]);
    });
});
