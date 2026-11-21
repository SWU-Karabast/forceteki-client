import React from 'react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import { findCard, leadersByPlayer, leadersOnBoard, loadRenderCapture, renderGameState, unitsInPlay } from '../../helpers/gameState';

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
});
