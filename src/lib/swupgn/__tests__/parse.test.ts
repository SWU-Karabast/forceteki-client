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
        // DELIBERATE: the fixture is a pre-publication 1.1 file, kept as compatibility
        // coverage. Version numbers do NOT order this format — a file saying 1.1 is OLDER
        // than one saying 1.0, because the format was renumbered at publication. Match the
        // Game tag exactly; never >=.
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

describe('parse — 1.0 sections (STORY/CARDS), and 1.1 files still read', () => {
    // forceteki added `%%% STORY` (rendered narrative) and `%%% CARDS` (id -> name index)
    // and renumbered the format 1.1 -> 1.0. A reader that treats an unknown section as an
    // error rejects the whole file, which is what this client did before re-vendoring.
    const withNewSections = [
        '[Game "SWU-PGN/1.0"] [GameId "g"] [Date "d"] [CardPool "SOR"] [Engine "e"] [Seed "0"]',
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
