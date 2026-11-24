/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import GameTimer from '@/app/_components/Gameboard/_subcomponents/OpponentTray/GameTimer';
import { TimerVisibility } from '@/app/_contexts/UserTypes';
import { loadPreferencesFromLocalStorage, savePreferencesToLocalStorage } from '@/app/_utils/ServerAndLocalStorageUtils';
import { loadRenderCapture, renderGameState } from '../../helpers/gameState';

/** Sets the timer visibility the way an anonymous player's preference is kept, which the real provider reads. */
const preferTimerVisibility = (timerVisibility: TimerVisibility) => {
    const preferences = loadPreferencesFromLocalStorage();
    savePreferencesToLocalStorage({ ...preferences, gameOptions: { ...preferences.gameOptions, timerVisibility } });
};

/** Makes the browser report that the player prefers reduced motion. */
const preferReducedMotion = () => {
    const matchMedia = window.matchMedia;
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        ...matchMedia(query),
        matches: query.includes('prefers-reduced-motion: reduce'),
    }));
};

/**
 * The next game state, in which the end of round 1 has given `seconds` back to the player in `seat` (0 or 1), leaving
 * them `mainTimeRemainingSeconds`. TODO: hand-written, since no state the server captures has a grant in it (captures
 * are of games without timers); replace with a capture once the server can make one.
 */
const withGrant = (state: any, seat: number, seconds: number, mainTimeRemainingSeconds: number) => {
    const next = structuredClone(state);
    const player = next.players[Object.keys(next.players)[seat]];
    player.mainTimeGrant = { round: 1, seconds };
    player.mainTimeRemainingSeconds = mainTimeRemainingSeconds;
    return next;
};

/** The "+Ns" chips, in the order drawn: the opponent's main time sits above the player's. */
const grantChips = () => screen.queryAllByLabelText(/seconds of main time added/).map((chip) => chip.textContent);

const grantRing = () => screen.queryByTestId('main-time-grant-ring');

describe('The game timer, when the end of a round gives main time back', () => {
    afterEach(() => {
        localStorage.clear();
    });

    it('shows the time each player was given beside their own main time, and the player\'s on the ring', () => {
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');
        expect(grantChips()).toEqual([]);
        expect(grantRing()).toBeNull();

        receive(withGrant(withGrant(state, 0, 10, 100), 1, 6, 120));

        expect(grantChips(), 'the opponent\'s above, the player\'s below').toEqual(['+6s', '+10s']);
        expect(grantRing()).not.toBeNull();
    });

    it('shows nothing on the ring for the opponent\'s grant alone', () => {
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');

        receive(withGrant(state, 1, 6, 120));

        expect(grantChips()).toEqual(['+6s']);
        expect(grantRing()).toBeNull();
    });

    it('shows a grant beside the main time only, with the turn timer hidden', () => {
        preferTimerVisibility(TimerVisibility.HideTurnTimer);
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');

        receive(withGrant(state, 0, 10, 100));

        expect(grantChips()).toEqual(['+10s']);
        expect(grantRing()).toBeNull();
    });

    it('shows nothing with the whole timer hidden', () => {
        preferTimerVisibility(TimerVisibility.HideAll);
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');

        receive(withGrant(state, 0, 10, 100));

        expect(grantChips()).toEqual([]);
        expect(grantRing()).toBeNull();
    });

    it('shows the grant and the new main time at once, off the ring, for a player who prefers reduced motion', () => {
        preferReducedMotion();
        const state = loadRenderCapture('board', 'player1');
        const { receive } = renderGameState(<GameTimer />, state, 'player1');

        receive(withGrant(state, 0, 10, 100));

        expect(grantChips()).toEqual(['+10s']);
        expect(grantRing()).toBeNull();
        expect(screen.getByLabelText('10 seconds of main time added').previousElementSibling?.textContent, 'no count-up')
            .toBe('1:40');
    });
});
