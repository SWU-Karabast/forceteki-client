import React from 'react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import { findCard, loadRenderCapture, renderGameState, unitsInPlay } from '../../helpers/gameState';

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
});
