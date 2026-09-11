import { describe, it, expect } from 'vitest';
import { buildMoveList } from '../swupgnMoves';
import { frameAction } from '../replayAction';
import { firstFrameByAction, formatGameMeta } from '../replayMoves';
import { makeNameResolver } from '../swupgnCardNames';
import { parse, type GameEvent } from '@/lib/swupgn';
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

describe('firstFrameByAction (spec §9.1 `for`)', () => {
    it('names the first record filed under each action, and nothing for an unstamped file', () => {
        const events = [
            { seq: 'R1.A.1', t: 'PLAY' },
            { seq: 'R1.A.1a', t: 'MOVE' },
            // Numbered before the action they belong to: the target choice and the exhaust.
            { seq: 'R1.A.1b', t: 'CHOICE', for: 'R1.A.2' },
            { seq: 'R1.A.1c', t: 'EXHAUST', for: 'R1.A.2' },
            { seq: 'R1.A.2', t: 'ATTACK' },
        ];
        const m = firstFrameByAction(events);
        expect(m.get('R1.A.2')).toBe(2);
        expect(m.size).toBe(1);
        expect(firstFrameByAction([{}, {}]).size).toBe(0);
    });
});

describe('formatGameMeta (spec §5.2)', () => {
    const start = '2026-09-11T20:00:00.000Z';
    it('shows the duration Date/EndDate give, and the match a file belongs to', () => {
        expect(formatGameMeta({ date: start, endDate: '2026-09-11T20:12:31.000Z' })).toBe('12m 31s');
        expect(formatGameMeta({ date: start, endDate: '2026-09-11T21:04:00.000Z' })).toBe('1h 04m');
        expect(formatGameMeta({ date: start, endDate: start, match: 'sha256:9f3a1c2b4d5e6f', gameNumber: 2 }))
            .toBe('0s · game 2 of match 9f3a1c2');
    });
    it('states only what the file states', () => {
        // No EndDate (unfinished game, or an older writer): no duration, and no placeholder.
        expect(formatGameMeta({ date: start })).toBe('');
        // GameNumber is meaningless without Match (§5.2), so it never appears alone.
        expect(formatGameMeta({ date: start, gameNumber: 3 })).toBe('');
        expect(formatGameMeta({ match: 'abc1234567' })).toBe('match abc1234');
        // A clock that went backwards between the two stamps says nothing, never "-3m".
        expect(formatGameMeta({ date: '2026-09-11T20:12:00.000Z', endDate: start })).toBe('');
        expect(formatGameMeta({ date: 'not a date', endDate: start })).toBe('');
    });
});

describe('LEADER_FLIP reaches the caption and the move list (spec §16)', () => {
    const flip = { seq: 'R2.A.3', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false } as unknown as GameEvent;
    const names = { nameOf: (id: string) => (id === 'TWI#017' ? 'Chancellor Palpatine' : id) };

    it('captions the frame with §16 wording and highlights the leader', () => {
        // render.ts (verbatim upstream) prints the same sentence; these must not drift.
        expect(frameAction(flip, names)).toMatchObject({
            label: 'Player 1 flips Chancellor Palpatine',
            highlight: ['TWI#017'],
        });
    });

    it('is a click-to-seek row: it is the only record saying the leader changed', () => {
        expect(buildMoveList([flip], names)).toEqual([
            { seq: 'R2.A.3', t: 'LEADER_FLIP', player: 'Player 1', label: 'Player 1 flips Chancellor Palpatine' },
        ]);
    });
});
