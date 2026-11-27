import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import SpectatorIndicator from '@/app/_components/Gameboard/_subcomponents/Overlays/ChatDrawer/SpectatorIndicator';
import { findCard, leadersByPlayer, leadersOnBoard, loadRenderCapture, renderGameState, unitsInPlay, withSpectatorSummary } from '../../helpers/gameState';

describe('The mirrored board, seen by player1', () => {
    it('draws every unit in both arenas', () => {
        const state = loadRenderCapture('board', 'player1');
        renderGameState(<Board sidebarOpen={false} />, state, 'player1');

        const units = unitsInPlay(state);
        expect(units.length).toBeGreaterThan(0);
        for (const unit of units) {
            expect(findCard(unit.uuid), `${unit.name} (${unit.uuid})`).not.toBeNull();
        }
    });

    it('draws one leader for each player', () => {
        const state = loadRenderCapture('board', 'player1');
        renderGameState(<Board sidebarOpen={false} />, state, 'player1');

        const leaders = leadersByPlayer(state);
        expect(leaders.map((playerLeaders) => playerLeaders.length)).toEqual([1, 1]);
        expect(leadersOnBoard().sort()).toEqual(leaders.flat().sort());
    });

    describe('the spectator indicator', () => {
        const spectatingAllowed = { settings: { allowSpectators: true } };
        const spectatingOff = { settings: { allowSpectators: false } };

        it('shows how many people are watching and that they can\'t see the player\'s name or hand', () => {
            const state = withSpectatorSummary(loadRenderCapture('board', 'player1'), 3);
            renderGameState(<SpectatorIndicator />, state, 'player1', { lobbyState: spectatingAllowed });

            const indicator = screen.getByLabelText('3 people are watching. Spectators can\'t see your name or your hand.');
            expect(indicator.querySelector('[data-spectator-count]')?.textContent).toBe('3');
        });

        it('counts one person in the singular', () => {
            const state = withSpectatorSummary(loadRenderCapture('board', 'player1'), 1);
            renderGameState(<SpectatorIndicator />, state, 'player1', { lobbyState: spectatingAllowed });

            expect(screen.getByLabelText('1 person is watching. Spectators can\'t see your name or your hand.').querySelector('[data-spectator-count]')?.textContent).toBe('1');
        });

        it('shows 0 when the lobby allows spectating, so the player knows people could watch', () => {
            const state = withSpectatorSummary(loadRenderCapture('board', 'player1'), 0);
            renderGameState(<SpectatorIndicator />, state, 'player1', { lobbyState: spectatingAllowed });

            expect(screen.getByLabelText('No one is watching right now. Spectators can\'t see your name or your hand.').querySelector('[data-spectator-count]')?.textContent).toBe('0');
        });

        it('is hidden at 0 when the lobby does not allow spectating', () => {
            const state = withSpectatorSummary(loadRenderCapture('board', 'player1'), 0);
            renderGameState(<SpectatorIndicator />, state, 'player1', { lobbyState: spectatingOff });

            expect(screen.queryByLabelText(/watching/)).toBeNull();
        });

        it('still shows people who are watching after the lobby stops allowing spectating', () => {
            const state = withSpectatorSummary(loadRenderCapture('board', 'player1'), 2);
            renderGameState(<SpectatorIndicator />, state, 'player1', { lobbyState: spectatingOff });

            expect(screen.getByLabelText(/^2 people are watching\./).querySelector('[data-spectator-count]')?.textContent).toBe('2');
        });

        it('is hidden when the server sends no spectator summary', () => {
            renderGameState(<SpectatorIndicator />, loadRenderCapture('board', 'player1'), 'player1', { lobbyState: spectatingAllowed });

            expect(screen.queryByLabelText(/watching/)).toBeNull();
        });

        it('follows the count in each new game state', () => {
            const state = loadRenderCapture('board', 'player1');
            const { receive } = renderGameState(<SpectatorIndicator />, withSpectatorSummary(state, 1), 'player1', { lobbyState: spectatingAllowed });

            receive(withSpectatorSummary(state, 4));

            expect(screen.getByLabelText(/^4 people are watching\./).querySelector('[data-spectator-count]')?.textContent).toBe('4');
        });
    });
});
