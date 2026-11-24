import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import Resources from '@/app/_components/Gameboard/_subcomponents/PlayerTray/Resources';
import { loadControlChain, renderGameState } from '../../helpers/gameState';

// The chain: player2, who does not have the initiative, is waiting on player1; player1 resources a card; player2 is
// shown that; the next action phase.
describe('Regroup resource', () => {
    const choiceIndicator = () => screen.queryByTestId('initiative-player-choice');
    const pendingResourceBadge = () => screen.queryByTestId('opponent-pending-resource');

    it('shows the player without the initiative what their opponent has chosen', () => {
        const [waiting, , opponentResourced, nextAction] = loadControlChain('regroup-resource');
        const { receive } = renderGameState(<Board sidebarOpen={false} />, waiting.state, waiting.participant);

        // while the initiative player is choosing, the prompt reads as a waiting prompt, with a hint under it
        const waitingTitle = 'Waiting for opponent to resource';
        const ownTitle = waiting.state.players[Object.keys(waiting.state.players)[1]].promptState.menuTitle;
        const choosingHint = 'You can choose now or wait for them to decide';
        expect(screen.getByText(waitingTitle), 'the waiting title').not.toBeNull();
        expect(screen.queryByText(ownTitle), 'the prompt\'s own text while waiting').toBeNull();
        expect(screen.getByRole('status', { name: choosingHint })).toBe(choiceIndicator());

        // once they have chosen, it is the player's own prompt again, with what they chose under it
        receive(opponentResourced.state);
        expect(screen.getByText(ownTitle), 'the prompt\'s own text').not.toBeNull();
        expect(screen.queryByText(waitingTitle), 'the waiting title once they have chosen').toBeNull();
        expect(screen.getByRole('status', { name: 'Initiative player resourced a card' })).toBe(choiceIndicator());
        expect(screen.queryByText(choosingHint), 'the hint once they have chosen').toBeNull();

        receive(nextAction.state);
        expect(choiceIndicator(), 'once the resource step is over').toBeNull();
    });

    it('shows the player with the initiative nothing about their opponent', () => {
        const [, initiativeChoosing] = loadControlChain('regroup-resource');
        renderGameState(<Board sidebarOpen={false} />, initiativeChoosing.state, initiativeChoosing.participant);

        expect(choiceIndicator()).toBeNull();
    });

    it('marks the opponent\'s resources as about to go up only once they have resourced a card', () => {
        const [waiting, , opponentResourced] = loadControlChain('regroup-resource');
        const [opponentId, ownId] = Object.keys(waiting.state.players);
        const { receive } = renderGameState(
            <>
                <Resources trayPlayer={opponentId} />
                <Resources trayPlayer={ownId} />
            </>,
            waiting.state,
            waiting.participant
        );

        expect(pendingResourceBadge(), 'while the opponent is choosing').toBeNull();

        receive(opponentResourced.state);
        expect(screen.getAllByTestId('opponent-pending-resource').length, 'on the opponent\'s resources only').toBe(1);
        expect(screen.getByRole('status', { name: 'Initiative player is about to gain a resource' })).toBe(pendingResourceBadge());
    });
});
