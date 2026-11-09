/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import { clickCard, findCard, loadControlChain, loadRenderSnapshot, renderGameState, type Participant } from '../helpers/gameState';

/** The units in both arenas. Upgrades are drawn on the unit they are attached to, not as cards of their own. */
const unitsInPlay = (state: any): any[] => Object.values(state.players).flatMap((player: any) => [
    ...player.cardPiles.groundArena,
    ...player.cardPiles.spaceArena,
]).filter((card) => !card.parentCardId);

describe('Board', () => {
    describe.each<Participant>(['player1', 'spectator'])('the mirrored board, seen by %s', (participant) => {
        it('draws every unit in both arenas', () => {
            const state = loadRenderSnapshot('board', participant);
            renderGameState(<Board sidebarOpen={false} />, state, participant);

            const units = unitsInPlay(state);
            expect(units.length).toBeGreaterThan(0);
            for (const unit of units) {
                expect(findCard(unit.uuid), `${unit.name} (${unit.uuid})`).not.toBeNull();
            }
        });
    });

    it('sends each click of an attack and draws the result', () => {
        const [chooseAttacker, chooseTarget, result] = loadControlChain('attack');
        const { sent, receive } = renderGameState(<Board sidebarOpen={false} />, chooseAttacker.state, chooseAttacker.participant);

        // the attacker is the unit player1 selected, and the defender the unit they selected next
        const [, attacker] = chooseAttacker.send[0] as [string, string];
        const [, defender] = chooseTarget.send[0] as [string, string];

        clickCard(attacker);
        expect(sent.mock.calls.map(([message]) => message)).toEqual(chooseAttacker.send);

        sent.mockClear();
        receive(chooseTarget.state);
        clickCard(defender);
        expect(sent.mock.calls.map(([message]) => message)).toEqual(chooseTarget.send);

        receive(result.state);
        expect(findCard(defender), 'the defeated defender').toBeNull();
        expect(findCard(attacker), 'the attacker').not.toBeNull();
    });
});
