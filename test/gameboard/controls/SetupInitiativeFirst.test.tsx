import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Board from '@/app/_components/Gameboard/Board/Board';
import { DefaultPopupModal } from '@/app/_components/_sharedcomponents/Popup/PopupVariant/DefaultPopup';
import { DefaultPopup, PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { getInitiativePlayerChoice } from '@/app/_components/Gameboard/_subcomponents/InitiativePlayerChoice';
import { IControlStep, loadControlChain, renderGameState } from '../../helpers/gameState';

// The chain: in the mulligan, player2, who does not have the initiative, keeps first, waits and cancels; player1 takes a
// mulligan; player2, shown that, keeps; the setup's resource step, where neither player chooses first.
const [choosingMulligan, waitingOnMulligan, choosingMulliganAgain, , shownMulligan, resourceStep] =
    loadControlChain('setup-initiative-first');

const promptStateOf = (step: IControlStep) => step.state.players[Object.keys(step.state.players)[1]].promptState;

/** The popup the client opens for the mulligan, as `GameProvider` builds it from the prompt state. */
const mulliganPopup = (step: IControlStep): DefaultPopup => {
    const promptState = promptStateOf(step);
    return {
        type: 'default',
        uuid: promptState.promptUuid,
        title: promptState.menuTitle,
        buttons: promptState.buttons,
        source: PopupSource.PromptState,
        initiativePlayerChoice: getInitiativePlayerChoice(promptState),
    };
};

describe('Setup, the player with the initiative choosing first in the mulligan', () => {
    it('reads what the initiative player has chosen from each prompt the player without the initiative is sent', () => {
        expect(getInitiativePlayerChoice(promptStateOf(choosingMulligan))?.label).toBe('Initiative player is choosing');
        expect(getInitiativePlayerChoice(promptStateOf(waitingOnMulligan)), 'waiting, after choosing first').toBeUndefined();
        expect(getInitiativePlayerChoice(promptStateOf(shownMulligan))?.label).toBe('Initiative player took a mulligan');
        expect(getInitiativePlayerChoice(promptStateOf(resourceStep)), 'the setup\'s resource step, which has no order').toBeUndefined();
    });

    it('shows the initiative player\'s mulligan choice in the mulligan popup', () => {
        renderGameState(<DefaultPopupModal data={mulliganPopup(shownMulligan)} />, shownMulligan.state, shownMulligan.participant);

        expect(screen.getByRole('status', { name: 'Initiative player took a mulligan' })).not.toBeNull();
        expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Keep' }).disabled).toBe(false);
    });

    it('shows a disabled Waiting button and a Cancel button in the popup after the player without the initiative chooses first', () => {
        const { sent } = renderGameState(<DefaultPopupModal data={mulliganPopup(waitingOnMulligan)} />, waitingOnMulligan.state, waitingOnMulligan.participant);

        const buttons = screen.getAllByRole<HTMLButtonElement>('button').filter((button) => button.getAttribute('aria-label') !== 'minimize');
        expect(buttons.map((button) => button.textContent), 'Cancel to the left of Waiting').toEqual(['Cancel', 'Waiting']);
        expect(buttons[1].disabled).toBe(true);

        fireEvent.click(buttons[1]);
        expect(sent, 'a click on the disabled Waiting button').not.toHaveBeenCalled();

        fireEvent.click(buttons[0]);
        expect(sent.mock.calls.map(([message]) => message)).toEqual(waitingOnMulligan.send);
        expect(getInitiativePlayerChoice(promptStateOf(choosingMulliganAgain))?.label, 'choosing again').toBe('Initiative player is choosing');
    });

    it('shows no status row in the setup\'s resource step', () => {
        renderGameState(<Board sidebarOpen={false} />, resourceStep.state, resourceStep.participant);

        expect(screen.queryByTestId('initiative-player-choice')).toBeNull();
    });
});
