import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, fold, foldFrames, render, checkKeyframes, normalizeEvents, SwuPgnError, RESERVED_KEYS, type GameEvent } from '../index';
import { formatResult } from '@/app/_utils/replayMoves';
import { adaptState } from '@/app/_utils/swupgnBoardAdapter';
import { fileIssues, resultMismatch } from '@/app/_utils/swupgnFileIssues';

/**
 * Spec §20: the conformance suite, driven by forceteki `swupgn/test-vectors/manifest.json`
 * (copied verbatim with `negative/`). The manifest's levels and codes are a VALIDATOR's; the
 * client ships no validator (Node-only), so what applies here is the parser's half:
 *
 * - a `malformed` entry must be rejected with exactly its listed code (§3 [P-01]);
 * - every other entry is well-formed and must parse (§3 [P-01]), and the fold must read it
 *   without crashing (§3 [F-01]) or reaching a prototype (§3 [P-06]), however invalid it is.
 *
 * The positive entries' fold and render equality is asserted in vectors.test.ts.
 */
interface ManifestEntry {
    file: string;
    class: 'positive' | 'negative';
    level: 'malformed' | 'well-formed' | 'valid' | 'verified' | 'complete';
    errors: string[];
    warnings: string[];
    // The Engine product of a generated vector, or "hand". Read for its type only.
    writer: string;
    about?: string;
}

const DIR = path.join(__dirname, 'fixtures/vectors');
const MANIFEST = JSON.parse(readFileSync(path.join(DIR, 'manifest.json'), 'utf-8')) as { vectors: ManifestEntry[] };
const read = (e: ManifestEntry) => readFileSync(path.join(DIR, e.file), 'utf-8');

/** Every own key of the shared prototypes, to prove a hostile file added none. */
const protoKeys = () => [Object.prototype, Array.prototype, Function.prototype]
    .map((p) => Object.getOwnPropertyNames(p).sort().join(','));

describe('manifest.json', () => {
    it('lists 13 positive and 33 negative vectors, each naming its writer', () => {
        expect(MANIFEST.vectors.filter((v) => v.class === 'positive')).toHaveLength(13);
        expect(MANIFEST.vectors.filter((v) => v.class === 'negative')).toHaveLength(33);
        for (const v of MANIFEST.vectors) {
            expect(typeof v.writer, v.file).toBe('string');
        }
    });
});

describe.each(MANIFEST.vectors.filter((v) => v.level === 'malformed'))('malformed: $file', (entry) => {
    it(`is rejected with ${entry.errors.join(', ')}`, () => {
        expect(entry.errors).toHaveLength(1);
        let err: unknown;
        try {
            parse(read(entry));
        } catch (e) {
            err = e;
        }
        expect(err).toBeInstanceOf(SwuPgnError);
        expect((err as SwuPgnError).code).toBe(entry.errors[0]);
    });
});

describe.each(MANIFEST.vectors.filter((v) => v.level !== 'malformed'))('well-formed: $file ($level)', (entry) => {
    it('parses', () => {
        expect(() => parse(read(entry))).not.toThrow();
    });

    // Validator-only codes (schema, bad-zone, duplicate-seq, dangling-ref, reserved-key,
    // over-cap, keyframe-mismatch, pre-release, unknown-type/section, newer-minor,
    // unknown-value) are not the parser's to report, but the reader must survive every one.
    it('folds, renders, checks and adapts without crashing or touching a prototype', () => {
        const before = protoKeys();
        const doc = parse(read(entry));
        const events = normalizeEvents(doc.events);
        const final = fold(events);
        const frames = foldFrames(events);
        expect(frames).toHaveLength(events.length);
        expect(() => render(doc)).not.toThrow();
        expect(() => checkKeyframes(events)).not.toThrow();
        expect(() => adaptState(final, doc, { 1: 'P1', 2: 'P2' })).not.toThrow();
        expect(protoKeys()).toEqual(before);
        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        // Every list the fold grows is capped at 1000 (§3 [F-05]), whatever the keyframe held.
        for (const s of [final, ...frames]) {
            for (const seat of [1, 2] as const) {
                const ps = s.players[seat];
                for (const list of [ps?.hand, ps?.discard, ps?.cards, ps?.resources, ps?.baseUpgrades, ps?.baseCaptured]) {
                    expect((list ?? []).length).toBeLessThanOrEqual(1000);
                }
            }
        }
    });
});

describe('the hostile negatives', () => {
    const entry = (name: string) => MANIFEST.vectors.find((v) => v.file === `negative/${name}.swupgn`)!;

    // Its `__proto__` is a key of a keyframe card's statusTokens, so parse refuses it as a reserved key.
    it('proto-token: parse refuses it, and fold() keeps the prototype clean in events built without parse()', () => {
        expect(() => parse(read(entry('proto-token')))).toThrow(SwuPgnError);
        // fold() is public: the same records, read line by line with JSON.parse and no parse().
        const text = read(entry('proto-token'));
        const body = text.slice(text.indexOf('%%% EVENTS') + '%%% EVENTS'.length).split('\n%%%')[0];
        const events = body.split('\n').filter((l) => l.trim().startsWith('{')).map((l) => JSON.parse(l)) as GameEvent[];
        const before = protoKeys();
        const s = fold(events);
        expect(protoKeys()).toEqual(before);
        for (const seat of [1, 2] as const) {
            for (const c of s.players[seat]!.cards) {
                expect(Object.getPrototypeOf(c.statusTokens)).toBe(Object.prototype);
                expect(Object.keys(c.statusTokens).filter((k) => RESERVED_KEYS.has(k))).toEqual([]);
            }
        }
    });

    it('over-cap: a keyframe with a 1002-card hand is damaged and not snapped to (§13)', () => {
        const doc = parse(read(entry('over-cap')));
        const kf = doc.events.find((e) => e.t === 'ROUND_START' && e.keyframe) as { keyframe: { players: Record<string, { hand: string[] }> } };
        expect(kf.keyframe.players['1'].hand.length).toBeGreaterThan(1000);
        expect(fold(doc.events).players[1]!.hand.length).toBeLessThan(1000);
        expect(checkKeyframes(doc.events).mismatches.map((m) => m.got)).toContain('damaged keyframe (ignored)');
    });
});

describe('the newer-minor negatives (§18): validator codes only, so they parse', () => {
    const entry = (name: string) => MANIFEST.vectors.find((v) => v.file === `negative/${name}.swupgn`)!;

    it('newer-minor-result: an outcome 1.0 does not know is kept raw, and shows as Incomplete', () => {
        const doc = parse(read(entry('newer-minor-result')));
        expect(['P1', 'P2', 'Draw', 'Incomplete']).not.toContain(doc.header.result);
        expect(formatResult(doc.header.result)).toBe('Incomplete');
    });

    it.each(['newer-minor-result-seat', 'newer-minor-bad-seat'])('%s: parses, folds, and shows as Incomplete', (name) => {
        const doc = parse(read(entry(name)));
        expect(() => fold(doc.events)).not.toThrow();
        expect(formatResult(doc.header.result)).toBe('Incomplete');
    });

    it('formatResult: a lowercase seat is no seat, and P<digits> beyond P2 is no winner', () => {
        expect(formatResult('P1')).toBe('Player 1');
        expect(formatResult('P2')).toBe('Player 2');
        expect(formatResult('Draw')).toBe('Draw');
        for (const v of ['p1', 'P3', 'P10', 'Resigned', '', undefined]) {
            expect(formatResult(v), String(v)).toBe('Incomplete');
        }
    });
});

describe('result-mismatch (§10.2, §24): a validator code, so the file parses', () => {
    const entry = MANIFEST.vectors.find((v) => v.file === 'negative/result-mismatch.swupgn')!;

    it('is listed as the hand-written, well-formed negative it is', () => {
        expect(entry).toMatchObject({ class: 'negative', writer: 'hand', level: 'well-formed', errors: ['result-mismatch'] });
    });

    it('parses and folds without touching a prototype, and File Health says the Result disagrees', () => {
        const before = protoKeys();
        const doc = parse(read(entry));
        expect(doc.header.result).toBe('P1');
        expect(doc.events.some((e) => e.t === 'GAME_END')).toBe(false);
        expect(() => fold(normalizeEvents(doc.events))).not.toThrow();
        expect(protoKeys()).toEqual(before);
        expect(resultMismatch(doc)).toBe(true);
        expect(fileIssues(doc).map((i) => i.message)).toContain('The Result in the header doesn\'t match how the game ended (§10.2).');
        // The header still shows what the file says; the notice is the only change.
        expect(formatResult(doc.header.result)).toBe('Player 1');
    });

    it('follows the validator: the last GAME_END counts, and an unknown Result is skipped (§18)', () => {
        const doc = parse(read(entry));
        const withEnd = (result: string, ...winners: unknown[]) => ({
            ...doc,
            header: { ...doc.header, result },
            events: [...doc.events, ...winners.map((winner, i) => ({ seq: `R9.A.${i}`, t: 'GAME_END', winner, reason: 'x' }) as unknown as GameEvent)],
        });
        expect(resultMismatch(withEnd('Incomplete'))).toBe(false);
        expect(resultMismatch(withEnd('P1', 1))).toBe(false);
        expect(resultMismatch(withEnd('P2', 2))).toBe(false);
        expect(resultMismatch(withEnd('Draw', 'Draw'))).toBe(false);
        expect(resultMismatch(withEnd('P1', 2))).toBe(true);
        expect(resultMismatch(withEnd('Incomplete', 1))).toBe(true);
        expect(resultMismatch(withEnd('P2', 1, 2))).toBe(false);
        expect(resultMismatch(withEnd('P1', 1, 2))).toBe(true);
        expect(resultMismatch(withEnd('Resigned'))).toBe(false);
        // A winner this version does not know gives no expectation, as upstream's validator.
        expect(resultMismatch(withEnd('P1', 3))).toBe(false);
    });

    it('no positive vector trips it', () => {
        for (const v of MANIFEST.vectors.filter((x) => x.class === 'positive')) {
            expect(resultMismatch(parse(read(v))), v.file).toBe(false);
        }
    });
});
