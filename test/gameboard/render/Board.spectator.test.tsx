import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import SpectatorIndicator from '@/app/_components/Gameboard/_subcomponents/Overlays/ChatDrawer/SpectatorIndicator';
import { findCard, leadersByPlayer, leadersOnBoard, loadRenderCapture, renderGameState, unitsInPlay, withSpectatorSummary } from '../../helpers/gameState';

describe('The mirrored board, seen by a spectator', () => {
    it('draws every unit in both arenas', () => {
        const state = loadRenderCapture('board', 'spectator');
        renderGameState(<Board sidebarOpen={false} />, state, 'spectator');

        const units = unitsInPlay(state);
        expect(units.length).toBeGreaterThan(0);
        for (const unit of units) {
            expect(findCard(unit.uuid), `${unit.name} (${unit.uuid})`).not.toBeNull();
        }
    });

    it('draws one leader for each player', () => {
        const state = loadRenderCapture('board', 'spectator');
        renderGameState(<Board sidebarOpen={false} />, state, 'spectator');

        const leaders = leadersByPlayer(state);
        expect(leaders.map((playerLeaders) => playerLeaders.length)).toEqual([1, 1]);
        expect(leadersOnBoard().sort()).toEqual(leaders.flat().sort());
    });

    describe('the spectator indicator', () => {
        it('shows how many people are watching, counting the spectator', () => {
            const state = withSpectatorSummary(loadRenderCapture('board', 'spectator'), 3);
            renderGameState(<SpectatorIndicator />, state, 'spectator');

            expect(screen.getByLabelText('3 people are watching, including you.').querySelector('[data-spectator-count]')?.textContent).toBe('3');
        });

        it('tells a lone spectator they are the only one watching', () => {
            const state = withSpectatorSummary(loadRenderCapture('board', 'spectator'), 1);
            renderGameState(<SpectatorIndicator />, state, 'spectator');

            expect(screen.getByLabelText('You are the only one watching.').querySelector('[data-spectator-count]')?.textContent).toBe('1');
        });

        it('is hidden when the server sends no spectator summary', () => {
            renderGameState(<SpectatorIndicator />, loadRenderCapture('board', 'spectator'), 'spectator');

            expect(screen.queryByLabelText(/watching/)).toBeNull();
        });
    });
});
