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

    it('folds to exactly .fold.json, apart from the two pile CONTENTS the client tracks better', () => {
        // `hand[]` / `discard[]` CONTENTS are the one documented divergence (VERSION.md, spec
        // §14 "not checked"): upstream only ever appends to them, the viewer renders them and
        // so removes a card that left. Everything else must be byte-identical, and the
        // client's piles must be exactly upstream's minus cards that actually left the zone.
        const expected = JSON.parse(readFileSync(path.join(DIR, `${name}.fold.json`), 'utf-8')) as ReducedState;
        const gone = (seat: 1 | 2, zone: 'hand' | 'discard') => new Set(doc.events
            .filter((e) => e.t === 'MOVE' && e.p === seat && e.from === zone && e.to !== zone)
            .map((e) => (e as { card: string }).card));
        for (const got of [fold(normalizeEvents(doc.events)), fold(doc.events)]) {
            for (const seat of [1, 2] as const) {
                for (const zone of ['hand', 'discard'] as const) {
                    const ours = new Set(got.players[seat]![zone]);
                    const left = gone(seat, zone);
                    expect(expected.players[seat]![zone].filter((id) => ours.has(id) || left.has(id)), `${zone} ${seat}`)
                        .toEqual(expected.players[seat]![zone]);
                    got.players[seat]![zone] = expected.players[seat]![zone];
                }
            }
            expect(got).toEqual(expected);
        }
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

    it('survives a serialize/parse round trip with every section intact', async () => {
        const { serialize } = await import('../index');
        const again = parse(serialize(doc));
        expect(again.events).toEqual(doc.events);
        expect(again.cards).toEqual(doc.cards);
        expect(again.story).toEqual(doc.story);
        expect(again.annotations).toEqual(doc.annotations);
        expect(again.header).toEqual(doc.header);
    });

    it('passes the §14 gate with no mismatch (spec §20 step 5)', () => {
        // Every vector is internally consistent, so a mismatch is a fold rule wrong here,
        // never a bad file. (Step 2, validate(), is asserted upstream on these same bytes;
        // the client does not ship the Node-only validator.)
        expect(checkKeyframes(doc.events).mismatches).toEqual([]);
        expect(checkKeyframes(normalizeEvents(doc.events)).mismatches).toEqual([]);
    });
});
