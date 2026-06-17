import { describe, it, expect } from 'vitest';
import { buildMoveList } from '../swupgnMoves';
import { makeNameResolver } from '../swupgnCardNames';
import { parse } from '@/lib/swupgn';
import { readFileSync } from 'fs';
import path from 'path';

const SAMPLE = readFileSync(
    path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/sample-game.swupgn'),
    'utf-8',
);

describe('buildMoveList', () => {
    const doc = parse(SAMPLE);
    const moves = buildMoveList(doc.events, makeNameResolver({ 'SOR#010': 'Darth Vader' }));

    it('keeps only discrete player actions (not MOVE/SHUFFLE noise)', () => {
        expect(moves.every((m) => m.t !== 'MOVE' && m.t !== 'SHUFFLE')).toBe(true);
    });

    it('labels each move with a human string and the acting player', () => {
        const play = moves.find((m) => m.t === 'PLAY');
        if (play) {
            expect(play.label).toMatch(/plays/);
            expect(['Player 1', 'Player 2']).toContain(play.player);
        }
        expect(moves.length).toBeGreaterThan(0);
    });

    it('carries the seq for seeking', () => {
        expect(moves[0].seq).toMatch(/^R\d/);
    });
});
