import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, READER_MAJOR, RESERVED_KEYS, SwuPgnError } from '../index';

/** The §24 code parse() rejects `text` with, or 'ok'. */
const code = (text: string, limits = {}): string => {
    try {
        parse(text, limits);
        return 'ok';
    } catch (e) {
        return e instanceof SwuPgnError ? e.code : `untyped: ${(e as Error).message}`;
    }
};

const SAMPLE = readFileSync(
    path.join(__dirname, 'fixtures/sample-game.swupgn'),
    'utf-8',
);

describe('parse(sample-game.swupgn)', () => {
    const doc = parse(SAMPLE);

    it('reads the header', () => {
        // DELIBERATE: the fixture is a pre-publication file, kept as compatibility coverage
        // for files read by shape (no `kind`, no RESOURCE, no STORY/CARDS).
        expect(doc.header.game).toBe('SWU-PGN/1.1');
        expect(doc.header.result).toBe('Incomplete');
        expect(doc.header.rounds).toBe(3);
        expect(doc.header.p1Leader).toBe('SOR#010');
    });

    it('reads both decks', () => {
        expect(doc.decks).toHaveLength(2);
        expect(doc.decks[0].p).toBe(1);
    });

    it('reads the event stream', () => {
        expect(doc.events.length).toBeGreaterThan(100);
        expect(doc.events[0].t).toBe('PHASE_START');
    });
});

describe('parse — malformed input', () => {
    // A header with everything required EXCEPT [Result], so buildHeader's req() throws.
    const headerMissingResult = [
        '[Game "SWU-PGN/1.0"]', '[GameId "1"]', '[Date "2026-01-01T00:00:00Z"]', '[CardPool "LOF"]',
        '[Engine "x"]', '[Seed "s"]', '[P1Id "a"]', '[P2Id "b"]', '[P1 "P1"]', '[P2 "P2"]',
        '[P1Leader "X"]', '[P1Base "Y"]', '[P2Leader "Z"]', '[P2Base "W"]',
        '[Reason "r"]', '[Rounds "1"]',
    ].join('\n');

    it('throws missing-tag on a missing required header tag', () => {
        expect(() => parse(headerMissingResult)).toThrow(/missing required header tag \[Result\]/);
        expect(code(headerMissingResult)).toBe('missing-tag');
    });

    it('throws on an invalid JSON record line', () => {
        const text = '[Game "SWU-PGN/1.1"]\n%%% EVENTS\n{not valid json}';
        expect(() => parse(text)).toThrow(/invalid JSON/);
    });

    it('skips a JSON record under an unrecognized %%% section (§18: a later version\'s section)', () => {
        const text = SAMPLE.replace('%%% EVENTS', '%%% BOGUS\n{"seq":"1","t":"PASS","p":1}\n\n%%% EVENTS');
        expect(parse(text).events).toEqual(parse(SAMPLE).events);
    });

    // Value: protects=a mangled Undos/RecorderErrors/WriterRevision/GameNumber tag refuses the file (bad-count), neither 0 nor absent; fails_when=optional counts are dropped silently again, so [RecorderErrors "x"] reads as "no errors"; why_new=upstream 0bbe90409 made optional counts fatal; seam=none; no_claim=validate() schema warnings
    it('reads header counts only when they are base-10 integers; anything else is bad-count, never 0 or absent', () => {
        const withTags = (tags: string) => SAMPLE.replace('[Rounds "3"]', `[Rounds "3"]\n${tags}`);
        const ok = parse(withTags('[Undos "2"]\n[RecorderErrors "0"]\n[WriterRevision "1"]\n[GameNumber "3"]')).header;
        expect(ok).toMatchObject({ undos: 2, recorderErrors: 0, writerRevision: 1, gameNumber: 3 });
        // Spec §5: no sign, space or exponent.
        for (const tag of ['[Undos " 2 "]', '[RecorderErrors "1.5"]', '[WriterRevision "-1"]', '[GameNumber "1e3"]', '[Undos "garbage"]', '[RecorderErrors ""]']) {
            expect(code(withTags(tag)), tag).toBe('bad-count');
        }
    });

    it('throws on a JSON record before any %%% section', () => {
        const text = '[Game "SWU-PGN/1.1"]\n{"seq":"1","t":"PASS","p":1}';
        expect(() => parse(text)).toThrow(/before any %%% section/);
    });

    // Rounds is required, so a corrupt value cannot fall back to "absent" the way an optional
    // count does. It used to read as 0; now the file is malformed (§24 bad-count).
    it('rejects a [Rounds] that is not base-10 digits', () => {
        const text = [
            '[Game "SWU-PGN/1.1"]', '[GameId "1"]', '[Date "d"]', '[CardPool "LOF"]',
            '[Engine "x"]', '[Seed "s"]', '[P1Id "a"]', '[P2Id "b"]', '[P1 "P1"]', '[P2 "P2"]',
            '[P1Leader "X"]', '[P1Base "Y"]', '[P2Leader "Z"]', '[P2Base "W"]',
            '[Result "Draw"]', '[Reason "r"]', '[Rounds "lots"]',
        ].join('\n');
        for (const bad of ['lots', 'seven', '-1', '1.5', ' 4', '']) {
            expect(code(text.replace('[Rounds "lots"]', `[Rounds "${bad}"]`)), `Rounds "${bad}"`).toBe('bad-count');
        }
    });
});

describe('parse — 1.0 sections (STORY/CARDS), and earlier files still read', () => {
    // forceteki added `%%% STORY` (rendered narrative) and `%%% CARDS` (id -> name index)
    // in 1.0. A reader that treats an unknown section as an error rejects the whole file,
    // which is what this client did before re-vendoring.
    const withNewSections = [
        '[Game "SWU-PGN/1.0"]', '[GameId "g"] [Date "d"] [CardPool "SOR"] [Engine "e"] [Seed "0"]',
        '[P1Id "a"] [P2Id "b"] [P1 "One"] [P2 "Two"]',
        '[P1Leader "SOR#010"] [P1Base "SOR#028"] [P2Leader "SOR#005"] [P2Base "SOR#020"]',
        '[Result "Draw"] [Reason "r"] [Rounds "1"]',
        '', '%%% STORY', '', ' ── action ──', '  1. Player 1 plays Wampa', '',
        '%%% CARDS', '{"id":"SOR#108","name":"Wampa"}',
        '', '%%% EVENTS', '{"seq":"R1.A.1","t":"PLAY","p":1,"card":"SOR#108","zone":"ground"}',
    ].join('\n');

    it('reads the story and card index without choking on free text', () => {
        const doc = parse(withNewSections);
        expect(doc.cards).toEqual([{ id: 'SOR#108', name: 'Wampa' }]);
        expect(doc.story?.join('\n')).toContain('Player 1 plays Wampa');
        expect(doc.events).toHaveLength(1);
    });

    it('still reads a pre-revision file that has neither section', () => {
        const doc = parse(withNewSections.replace(/%%% STORY[\s\S]*?%%% CARDS\n.*\n/, ''));
        expect(doc.events).toHaveLength(1);
        expect(doc.cards ?? []).toEqual([]);
    });
});

describe('parse — DoS ceiling on event count', () => {
    // A real game is a few thousand events. The cap bounds the per-frame fold and the
    // snapshot array so a hostile file cannot freeze or OOM the tab; upstream has no cap
    // because it never builds per-frame snapshots.
    it('refuses a file with an absurd number of events', () => {
        const header = '[Game "SWU-PGN/1.0"]\n[GameId "g"] [Date "d"] [CardPool "S"] [Engine "e"] [Seed "0"]\n'
            + '[P1Id "a"] [P2Id "b"] [P1 "A"] [P2 "B"]\n'
            + '[P1Leader "S#1"] [P1Base "S#2"] [P2Leader "S#3"] [P2Base "S#4"]\n'
            + '[Result "Draw"] [Reason "r"] [Rounds "1"]\n%%% EVENTS\n';
        const line = '{"seq":"x","t":"PASS","p":1}';
        const huge = header + Array.from({ length: 200_001 }, () => line).join('\n');
        expect(code(huge)).toBe('too-many-records');
    });
});

describe('parse — the Game tag gate (spec §18, §22.1)', () => {
    const withGame = (tag: string) => SAMPLE.replace(/\[Game "[^"]*"\]/, tag === null ? '' : `[Game "${tag}"]`);

    it('accepts every 1.x by shape, never by numeric order', () => {
        for (const v of ['SWU-PGN/1.0', 'SWU-PGN/1.1', 'SWU-PGN/1.7', 'SWU-PGN/1.42']) {
            expect(parse(withGame(v)).header.game).toBe(v);
        }
    });

    it('refuses a different major version, and anything that is not SWU-PGN', () => {
        // Compared as written: `01` is not this reader's `1` (§18).
        for (const v of ['SWU-PGN/2.0', 'SWU-PGN/0.9', 'SWU-PGN/10.0', 'SWU-PGN/01.0']) {
            expect(code(withGame(v)), v).toBe('unsupported-major');
        }
        // The magic number (§4, Appendix B game-line): `[Game "SWU-PGN/<major>.<minor>"]` alone.
        for (const v of ['PGN/1.0', 'swu-pgn/1.0', '', 'SWU-PGN/1', 'SWU-PGN/1.0.1', 'SWU-PGN/x']) {
            expect(code(withGame(v)), v).toBe('not-swupgn');
        }
        expect(READER_MAJOR).toBe(1);
    });

    it('reports a missing Game tag as not SWU-PGN: the first line is the magic number', () => {
        expect(code(SAMPLE.replace(/\[Game "[^"]*"\]\n?/, ''))).toBe('not-swupgn');
    });
});

describe('indexResolver takes an untyped name', () => {
    it('drops a non-string name and flattens newlines', async () => {
        const { indexResolver } = await import('../cardNames');
        const r = indexResolver([{ id: 'SOR#001', name: 5 } as unknown as { id: string; name: string }, { id: 'SOR#002', name: 'Line\r\n%%% EVENTS' }]);
        expect(r.nameOf('SOR#001')).toBe('SOR#001');
        expect(r.nameOf('SOR#002')).toBe('Line %%% EVENTS');
    });
});

describe('parse refuses a record that is not a JSON object', () => {
    it('names the line for null, a number, and an array', async () => {
        const { readFileSync } = await import('fs');
        const path = await import('path');
        const sample = readFileSync(path.join(__dirname, 'fixtures/sample-game.swupgn'), 'utf-8');
        // (an `[...]` line is header syntax, so an array never reaches the record path)
        for (const bad of ['null', '5', '"str"']) {
            const text = sample.replace('%%% EVENTS\n', `%%% EVENTS\n${bad}\n`);
            expect(text).not.toBe(sample);
            expect(() => parse(text)).toThrow(/is not a JSON object/);
        }
    });
});

describe('parse — later-version sections and oversized counts', () => {
    // Value: protects=a later version's prose section is ignored, not a hard failure (§18); fails_when=UNKNOWN sections are JSON-parsed again; why_new=the existing case only used a JSON line; seam=none; no_claim=none beyond protects
    it('skips a prose line under an unknown section', () => {
        const text = SAMPLE.replace('%%% EVENTS', '%%% COMMENTARY\nPlayer 1 opens strong.\n\n%%% EVENTS');
        expect(parse(text).events).toEqual(parse(SAMPLE).events);
    });

    // Value: protects=a header count past 2^53 is refused, not read as Infinity; fails_when=strictCount drops its safe-integer check; why_new=strict-count test used small malformed values only; seam=none; no_claim=display of the tag
    it('refuses a header count that overflows', () => {
        const text = SAMPLE.replace('\n%%%', `\n[WriterRevision "${'9'.repeat(400)}"]\n%%%`);
        expect(code(text)).toBe('bad-count');
    });
});

// Ported from forceteki test/server/swupgn/parse.spec.ts "parse grammar" at 950a65a82.
describe('parse grammar (spec §4, Appendix B, §24)', () => {
    const HEAD = [
        '[Game "SWU-PGN/1.0"]', '[GameId "g"] [Date "2026-06-16T00:00:00Z"] [CardPool "SOR"] [Engine "e"] [Seed "s"]',
        '[P1Id "p"] [P2Id "q"] [P1 "Player 1"] [P2 "Player 2"]',
        '[P1Leader "SOR#010"] [P1Base "SOR#028"] [P2Leader "SOR#005"] [P2Base "SOR#020"]',
        '[Result "P1"] [Reason "r"] [Rounds "1"]',
    ].join('\n');

    it('strips a leading byte order mark', () => {
        expect(code('\uFEFF' + HEAD)).toBe('ok');
    });

    it('requires the first line to be the Game tag', () => {
        expect(code('[GameId "g"]\n' + HEAD)).toBe('not-swupgn');
        expect(code('hello\n' + HEAD)).toBe('not-swupgn');
        expect(code('')).toBe('not-swupgn');
        expect(code('\n   \n')).toBe('not-swupgn');
        // Blank lines before it are allowed (Appendix B: *blank-line game-line).
        expect(code('\n\n' + HEAD)).toBe('ok');
    });

    it('requires the Game tag alone on its line, with a numeric version', () => {
        // The Game tag stands alone, with a numeric version (Appendix B game-line).
        expect(code(HEAD.replace('[Game "SWU-PGN/1.0"]', '[Game "SWU-PGN/x"]'))).toBe('not-swupgn');
        expect(code(HEAD.replace('[Game "SWU-PGN/1.0"]', '[Game "SWU-PGN/1.0"] [Format "Premier"]'))).toBe('not-swupgn');
    });

    // §18: a different major version would be misread, so it is refused, not read as 1.x.
    it('refuses a file of another major version', () => {
        expect(code(HEAD.replace('SWU-PGN/1.0', 'SWU-PGN/2.0'))).toBe('unsupported-major');
        expect(code(HEAD.replace('SWU-PGN/1.0', 'SWU-PGN/0.9'))).toBe('unsupported-major');
        // Compared as written, as the Game tag's schema does: `01` is not `1`.
        expect(code(HEAD.replace('SWU-PGN/1.0', 'SWU-PGN/01.0'))).toBe('unsupported-major');
        expect(code(HEAD.replace('SWU-PGN/1.0', 'SWU-PGN/1.7'))).toBe('ok');
    });

    it('reserves exactly the 13 names of Object.prototype and `prototype`', () => {
        expect([...RESERVED_KEYS].sort()).toEqual([...Object.getOwnPropertyNames(Object.prototype), 'prototype'].sort());
        expect(RESERVED_KEYS.size).toBe(13);
    });

    // §23: a key that names the object model is never data. `__proto__` can replace a prototype;
    // an own `toString` or `valueOf` that is not a function makes the object impossible to print,
    // so every reader that renders or compares the field throws. One check here protects them all.
    it('rejects a reserved key anywhere in any record', () => {
        const at = (section: string, line: string) => HEAD + `\n%%% ${section}\n` + line;
        for (const key of RESERVED_KEYS) {
            expect(code(at('EVENTS', `{"seq":"R1.A.1","t":"PASS","p":1,"x":{"${key}":1}}`)), `${key} nested`).toBe('reserved-key');
            expect(code(at('EVENTS', `{"seq":"R1.A.1","t":"DEFEAT","card":"SOR#108","reason":{"${key}":null}}`)), `${key} as a value`).toBe('reserved-key');
            expect(code(at('DECKS', `{"p":1,"${key}":1}`)), `${key} in DECKS`).toBe('reserved-key');
            expect(code(at('CARDS', `{"id":"SOR#108","name":"Wampa","${key}":1}`)), `${key} in CARDS`).toBe('reserved-key');
            expect(code(at('ANNOTATIONS', `{"ref":"R1.A.1","text":"t","x":[{"${key}":1}]}`)), `${key} in ANNOTATIONS`).toBe('reserved-key');
            expect(code(at('EVENTS', `{"seq":"R1.A.1","t":"STATUS_TOKEN","card":"SOR#108","token":"${key}","count":1}`)), `${key} as a status token`).toBe('reserved-key');
            expect(code(at('SETUP', `{"seq":"R0.S.1","t":"STATUS_TOKEN","card":"SOR#108","token":"${key}","count":1}`)), `${key} as a SETUP status token`).toBe('reserved-key');
            // §15: an annotation's what-if line may be folded too.
            expect(code(at('ANNOTATIONS', `{"ref":"R1.A.1","line":[{"seq":"R1.A.1","t":"STATUS_TOKEN","card":"SOR#108","token":"${key}","count":1}]}`)), `${key} in a what-if line`).toBe('reserved-key');
        }
        // The same words as values, or inside a longer key, are ordinary data.
        expect(code(at('EVENTS', '{"seq":"R1.A.1","t":"PASS","p":1,"x_toString":"constructor"}'))).toBe('ok');
        expect(code(at('EVENTS', '{"seq":"R1.A.1","t":"DEFEAT","card":"__proto__","reason":"toString"}'))).toBe('ok');
        expect(code(at('ANNOTATIONS', '{"ref":"R1.A.1","text":"constructor","by":"__proto__"}'))).toBe('ok');
        // Only a STATUS_TOKEN token is refused as a value.
        expect(code(at('EVENTS', '{"seq":"R1.A.1","t":"STATUS_TOKEN","card":"SOR#108","token":"advantage","count":1}'))).toBe('ok');
        expect(code(at('EVENTS', '{"seq":"R1.A.1","t":"CREATE_TOKEN","p":1,"token":"toString","zone":"ground"}'))).toBe('ok');
        // The token check runs only where a fold reads STATUS_TOKEN records.
        expect(code(at('DECKS', '{"p":1,"t":"STATUS_TOKEN","token":"toString"}'))).toBe('ok');
        expect(code(at('ANNOTATIONS', '{"ref":"R1.A.1","x":[{"t":"STATUS_TOKEN","token":"toString"}]}'))).toBe('ok');
    });

    it('rejects a header tag named by a reserved key', () => {
        for (const key of RESERVED_KEYS) {
            if ((/^[A-Za-z0-9]+$/).test(key)) {
                expect(code(HEAD + `\n[${key} "x"]`), key).toBe('reserved-key');
            }
        }
        expect(code(HEAD + '\n[XToString "x"]')).toBe('ok');
    });

    // The depth limit stops the scan as soon as it is passed, before any more nesting is tracked.
    it('refuses a line of a million open brackets at the depth limit', () => {
        expect(code(HEAD + '\n%%% EVENTS\n' + '{'.repeat(1_000_000))).toBe('too-deep');
    });

    // I-JSON (spec §4): JSON.parse keeps the last of two equal keys, another language's parser
    // the first, so a repeated key would fold to two different boards.
    it('rejects a record that repeats a key in one object', () => {
        const events = (line: string) => HEAD + '\n%%% EVENTS\n' + line;
        expect(code(events('{"seq":"R1.A.1","t":"MOVE","to":"hand","to":"ground"}'))).toBe('duplicate-key');
        expect(code(events('{"seq":"R1.A.1","t":"PASS","p":1,"x":{"a":1,"\\u0061":2}}'))).toBe('duplicate-key');
        // The same key in two different objects, and key-like text inside a value, are fine.
        expect(code(events('{"seq":"R1.A.1","t":"PASS","p":1,"x":{"p":1},"y":[{"p":2},{"p":3}],"z":"\\"p\\":1"}'))).toBe('ok');
        // Not JSON at all is still bad-json, not a duplicate.
        expect(code(events('{"a":1,"a":}'))).toBe('bad-json');
    });

    it('checks too-deep, then bad-json, then duplicate-key, then reserved-key', () => {
        const events = (line: string) => HEAD + '\n%%% EVENTS\n' + line;
        expect(code(events('['.repeat(70) + '{"a":1,"a":2,"__proto__":1'))).toBe('too-deep');
        expect(code(events('{"a":1,"a":2,"__proto__":1'))).toBe('bad-json');
        expect(code(events('{"__proto__":1,"a":1,"a":2}'))).toBe('duplicate-key');
        expect(code(events('[{"__proto__":1}]'))).toBe('reserved-key');
    });

    it('does not count brackets inside a JSON string toward the depth limit', () => {
        // The deep `{` run sits between escaped quotes, so a scanner that ends the string at `\"` sees it.
        const text = '"' + '['.repeat(70) + ' \\"' + '{'.repeat(70) + '\\" "';
        expect(code(HEAD + '\n%%% EVENTS\n{"seq":"R1.A.1","t":"PASS","p":1}\n%%% ANNOTATIONS\n{"ref":"R1.A.1","text":' + text + '}')).toBe('ok');
    });

    it('rejects text outside the brackets of a header line', () => {
        expect(code(HEAD.replace('[Rounds "1"]', '[Rounds "1"] trailing'))).toBe('bad-header-line');
    });

    it('rejects an escape other than \\\\ and \\" instead of dropping the backslash', () => {
        expect(code(HEAD.replace('[Reason "r"]', '[Reason "a\\nb"]'))).toBe('bad-escape');
        const ok = parse(HEAD.replace('[Reason "r"]', '[Reason "say \\"hi\\" \\\\ n"]'));
        expect(ok.header.reason).toBe('say "hi" \\ n');
    });

    it('rejects a tag given twice and a section given twice', () => {
        expect(code(HEAD + '\n[Rounds "2"]')).toBe('duplicate-tag');
        expect(code(HEAD + '\n%%% EVENTS\n%%% EVENTS')).toBe('duplicate-section');
        // Banner names are case-insensitive, so this is the same section twice.
        expect(code(HEAD + '\n%%% events\n%%% EVENTS')).toBe('duplicate-section');
    });

    it('reports a missing required tag and a record before any banner by code', () => {
        expect(code(HEAD.replace('[Result "P1"] ', ''))).toBe('missing-tag');
        expect(code(HEAD + '\n{"seq":"R1.A.1","t":"PASS","p":1}')).toBe('record-outside-section');
        expect(code(HEAD + '\n%%% EVENTS\n{not json}')).toBe('bad-json');
        expect(code(HEAD + '\n%%% EVENTS\nnull')).toBe('not-object');
    });

    it('skips an unknown section unread, even when its lines are not JSON', () => {
        expect(code(HEAD + '\n%%% X_NOTES\nfree text, not JSON\n%%% EVENTS')).toBe('ok');
    });

    it('rejects input over a limit rather than reading part of it', () => {
        const events = HEAD + '\n%%% EVENTS\n' + '{"seq":"R1.A.1","t":"PASS","p":1}\n'.repeat(3);
        expect(code(events, { maxRecords: 2 })).toBe('too-many-records');
        expect(code(events, { maxBytes: 100 })).toBe('too-large');
        expect(code(events, { maxLineLength: 20 })).toBe('line-too-long');
        expect(code(HEAD + '\n%%% EVENTS\n' + '['.repeat(70) + ']'.repeat(70))).toBe('too-deep');
    });

    it('accepts \\r\\n line ends and a missing final line feed (§3 [P-02])', () => {
        const doc = parse((HEAD + '\n%%% EVENTS\n{"seq":"R1.A.1","t":"PASS","p":1}').replace(/\n/g, '\r\n'));
        expect(doc.header.rounds).toBe(1);
        expect(doc.events).toHaveLength(1);
    });

    it('carries the line number on the error', () => {
        let err: unknown;
        try {
            parse(HEAD + '\n%%% EVENTS\n{"seq":"R1.A.1","t":"PASS","p":1}\n{oops}');
        } catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(SwuPgnError);
        expect((err as SwuPgnError).line).toBe(8);
    });
});

describe('parse — what the file carried that this version does not define (§18, §3 [A-01])', () => {
    const HEAD = [
        '[Game "SWU-PGN/1.0"]', '[GameId "g"] [Date "2026-06-16T00:00:00Z"] [CardPool "SOR"] [Engine "e"] [Seed "s"]',
        '[P1Id "p"] [P2Id "q"] [P1 "Player 1"] [P2 "Player 2"]',
        '[P1Leader "SOR#010"] [P1Base "SOR#028"] [P2Leader "SOR#005"] [P2Base "SOR#020"]',
        '[Result "P1"] [Reason "r"] [Rounds "1"]',
    ].join('\n');

    it('names a later version\'s section, but not an X_ extension (no warning, §18)', () => {
        const doc = parse(HEAD + '\n%%% X_SWUFORGE\nhint\n%%% COMMENTARY\nprose\n%%% EVENTS');
        expect(doc.skippedSections).toEqual(['COMMENTARY']);
        expect(parse(HEAD + '\n%%% x_lower\nhint\n%%% EVENTS').skippedSections).toBeUndefined();
    });

    it('keeps unknown tags and sections verbatim, in file order', () => {
        const doc = parse(HEAD + '\n[XSwuforgeDeckId "d\\"1"] [Event "Store Champs"]\n\n%%% X_SWUFORGE\n\n{"a":1}\n\nnot json\n\n%%% EVENTS');
        expect(doc.extraTags).toEqual([['XSwuforgeDeckId', 'd"1'], ['Event', 'Store Champs']]);
        expect(doc.extraSections).toEqual([{ banner: '%%% X_SWUFORGE', lines: ['{"a":1}', '', 'not json'] }]);
    });

    it('a tag named like an Object.prototype member is refused (§23); one that merely contains it is a tag', () => {
        expect(code(HEAD + '\n[constructor "x"]')).toBe('reserved-key');
        expect(code(HEAD + '\n[toString "y"]')).toBe('reserved-key');
        expect(parse(HEAD + '\n[XToString "y"]').extraTags).toEqual([['XToString', 'y']]);
        expect(({} as Record<string, unknown>).constructor).toBe(Object);
    });
});
