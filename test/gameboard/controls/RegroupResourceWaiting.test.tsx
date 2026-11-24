import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardActionTray from '@/app/_components/Gameboard/_subcomponents/PlayerTray/CardActionTray';
import { loadControlChain, renderGameState } from '../../helpers/gameState';

// The chain: player2, who does not have the initiative, resources a card before player1 has chosen; player2 waits,
// cancels, confirms again and waits; player1 skips; the next action phase.
describe('Regroup resource, waiting', () => {
    // the resource prompt's buttons are disabled for a moment after they appear, against double clicks
    const COOLDOWN_MS = 500;

    const button = (name: string) => screen.queryByRole<HTMLButtonElement>('button', { name });
    const passCooldown = () => act(() => {
        vi.advanceTimersByTime(COOLDOWN_MS);
    });

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the player without the initiative a disabled Waiting button and a Cancel button after they choose first', () => {
        const [choosing, waiting] = loadControlChain('regroup-resource-waiting');
        const { sent, receive } = renderGameState(<CardActionTray />, choosing.state, choosing.participant);

        expect(button('Waiting'), 'before they have chosen').toBeNull();
        expect(button('Cancel'), 'before they have chosen').toBeNull();

        receive(waiting.state);
        passCooldown();
        expect(button('Waiting')?.disabled).toBe(true);
        expect(button('Cancel')?.disabled).toBe(false);
        expect(screen.getAllByRole('button').map((element) => element.textContent), 'Cancel to the left of Waiting')
            .toEqual(['Cancel', 'Waiting']);

        fireEvent.click(button('Waiting')!);
        expect(sent, 'a click on the disabled Waiting button').not.toHaveBeenCalled();
    });

    it('sends a cancel as soon as Cancel appears, then shows the choice again', () => {
        const [, waiting, choosingAgain] = loadControlChain('regroup-resource-waiting');
        const { sent, receive } = renderGameState(<CardActionTray />, waiting.state, waiting.participant);

        // Cancel has no cooldown: the disabled Waiting button, not Cancel, takes the place of Confirm Resources
        expect(button('Cancel')?.disabled).toBe(false);
        fireEvent.click(button('Cancel')!);
        expect(sent.mock.calls.map(([message]) => message)).toEqual(waiting.send);

        receive(choosingAgain.state);
        passCooldown();
        expect(button('Cancel')).toBeNull();
        expect(button('Confirm Resources')?.disabled).toBe(false);
    });

    it('keeps the card they chose selected while they wait, and after they cancel', () => {
        const [, waiting, choosingAgain] = loadControlChain('regroup-resource-waiting');
        const selectedInHand = (state: typeof waiting.state) =>
            state.players[Object.keys(state.players)[1]].cardPiles.hand
                .filter((card: { selected?: boolean }) => card.selected)
                .map((card: { uuid: string }) => card.uuid);

        expect(selectedInHand(waiting.state).length).toBe(1);
        expect(selectedInHand(choosingAgain.state)).toEqual(selectedInHand(waiting.state));
    });
});
