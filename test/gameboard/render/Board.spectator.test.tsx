import React from 'react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import { findCard, loadRenderSnapshot, renderGameState, unitsInPlay } from '../../helpers/gameState';

describe('The mirrored board, seen by a spectator', () => {
    it('draws every unit in both arenas', () => {
        const state = loadRenderSnapshot('board', 'spectator');
        renderGameState(<Board sidebarOpen={false} />, state, 'spectator');

        const units = unitsInPlay(state);
        expect(units.length).toBeGreaterThan(0);
        for (const unit of units) {
            expect(findCard(unit.uuid), `${unit.name} (${unit.uuid})`).not.toBeNull();
        }
    });
});
