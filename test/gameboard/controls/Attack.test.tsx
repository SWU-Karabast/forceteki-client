import React from 'react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import { clickCard, findCard, loadControlChain, renderGameState } from '../../helpers/gameState';

describe('Attack', () => {
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
