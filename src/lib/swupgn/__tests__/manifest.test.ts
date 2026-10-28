import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, fold, foldFrames, render, checkKeyframes, normalizeEvents, SwuPgnError } from '../index';
import { adaptState } from '@/app/_utils/swupgnBoardAdapter';

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
    about?: string;
}

const DIR = path.join(__dirname, 'fixtures/vectors');
const MANIFEST = JSON.parse(readFileSync(path.join(DIR, 'manifest.json'), 'utf-8')) as { vectors: ManifestEntry[] };
const read = (e: ManifestEntry) => readFileSync(path.join(DIR, e.file), 'utf-8');

/** Every own key of the shared prototypes, to prove a hostile file added none. */
const protoKeys = () => [Object.prototype, Array.prototype, Function.prototype]
    .map((p) => Object.getOwnPropertyNames(p).sort().join(','));

describe('manifest.json', () => {
    it('lists 9 positive and 14 negative vectors', () => {
        expect(MANIFEST.vectors.filter((v) => v.class === 'positive')).toHaveLength(9);
        expect(MANIFEST.vectors.filter((v) => v.class === 'negative')).toHaveLength(14);
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

describe('the two hostile negatives', () => {
    const entry = (name: string) => MANIFEST.vectors.find((v) => v.file === `negative/${name}.swupgn`)!;

    it('proto-token: a `__proto__` status token stays an own key of its card, never a prototype', () => {
        const doc = parse(read(entry('proto-token')));
        const s = fold(doc.events);
        for (const seat of [1, 2] as const) {
            for (const c of s.players[seat]!.cards) {
                expect(Object.getPrototypeOf(c.statusTokens)).toBe(Object.prototype);
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
