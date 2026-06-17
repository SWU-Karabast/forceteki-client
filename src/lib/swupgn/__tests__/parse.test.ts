import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '../index';

const SAMPLE = readFileSync(
    path.join(__dirname, 'fixtures/sample-game.swupgn'),
    'utf-8',
);

describe('parse(sample-game.swupgn)', () => {
    const doc = parse(SAMPLE);

    it('reads the header', () => {
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
    // A header with everything required EXCEPT [Game], so buildHeader's req() throws.
    const headerMissingGame = [
        '[GameId "1"]', '[Date "2026-01-01T00:00:00Z"]', '[CardPool "LOF"]',
        '[Engine "x"]', '[Seed "s"]', '[P1Id "a"]', '[P2Id "b"]', '[P1 "P1"]', '[P2 "P2"]',
        '[P1Leader "X"]', '[P1Base "Y"]', '[P2Leader "Z"]', '[P2Base "W"]',
        '[Result "Draw"]', '[Reason "r"]', '[Rounds "1"]',
    ].join('\n');

    it('throws on a missing required header tag', () => {
        expect(() => parse(headerMissingGame)).toThrow(/missing required header tag/);
    });

    it('throws on an invalid JSON record line', () => {
        const text = '[Game "SWU-PGN/1.1"]\n%%% EVENTS\n{not valid json}';
        expect(() => parse(text)).toThrow(/invalid JSON/);
    });

    it('throws on a JSON record under an unrecognized %%% section', () => {
        const text = '[Game "SWU-PGN/1.1"]\n%%% BOGUS\n{"seq":"1","t":"PASS","p":1}';
        expect(() => parse(text)).toThrow(/unrecognized section/);
    });

    it('throws on a JSON record before any %%% section', () => {
        const text = '[Game "SWU-PGN/1.1"]\n{"seq":"1","t":"PASS","p":1}';
        expect(() => parse(text)).toThrow(/before any %%% section/);
    });

    it('falls back to rounds=0 when [Rounds] is non-numeric', () => {
        const text = [
            '[Game "SWU-PGN/1.1"]', '[GameId "1"]', '[Date "d"]', '[CardPool "LOF"]',
            '[Engine "x"]', '[Seed "s"]', '[P1Id "a"]', '[P2Id "b"]', '[P1 "P1"]', '[P2 "P2"]',
            '[P1Leader "X"]', '[P1Base "Y"]', '[P2Leader "Z"]', '[P2Base "W"]',
            '[Result "Draw"]', '[Reason "r"]', '[Rounds "lots"]',
        ].join('\n');
        expect(parse(text).header.rounds).toBe(0);
    });
});
