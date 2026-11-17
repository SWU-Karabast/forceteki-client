/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GameTimer from '@/app/_components/Gameboard/_subcomponents/OpponentTray/GameTimer';
import { TimerVisibility } from '@/app/_contexts/UserTypes';
import { loadRenderCapture, renderGameState } from '../../helpers/gameState';

// the real provider reads the signed-in user's preferences; these tests set the preference directly
const visibility = vi.hoisted(() => ({ current: 'standard' as TimerVisibility }));
vi.mock('@/app/_contexts/TimerVisibility.context', () => ({
    useTimerVisibilityContext: () => ({ timerVisibility: visibility.current, setTimerVisibility: () => undefined }),
}));

/** The next game state, in which the end of round 1 has given `seconds` back to the player in `seat` (0 or 1). */
const withGrant = (state: any, seat: number, seconds: number, mainTimeRemainingSeconds: number) => {
    const next = structuredClone(state);
    const player = next.players[Object.keys(next.players)[seat]];
    player.mainTimeGrant = { round: 1, seconds };
    player.mainTimeRemainingSeconds = mainTimeRemainingSeconds;
    return next;
};

const grantChip = (seconds: number) => screen.queryByLabelText(`${seconds} seconds of main time added`);

describe('The game timer, when the end of a round gives main time back', () => {
    beforeEach(() => {
        visibility.current = TimerVisibility.Standard;
    });

    it('shows the time each player was given', () => {
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');
        expect(grantChip(10)).toBeNull();

        receive(withGrant(withGrant(state, 0, 10, 100), 1, 6, 120));

        expect(grantChip(10), 'the player\'s own').not.toBeNull();
        expect(grantChip(6), 'the opponent\'s').not.toBeNull();
    });

    it('shows a grant with the turn timer hidden', () => {
        visibility.current = TimerVisibility.HideTurnTimer;
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');

        receive(withGrant(state, 0, 10, 100));

        expect(grantChip(10)).not.toBeNull();
    });

    it('shows nothing with the whole timer hidden', () => {
        visibility.current = TimerVisibility.HideAll;
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');

        receive(withGrant(state, 0, 10, 100));

        expect(grantChip(10)).toBeNull();
    });
});
