import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DropdownPopupModal } from '@/app/_components/_sharedcomponents/Popup/PopupVariant/DropdownPopup';
import { DropdownPopup, PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { loadRenderCapture, renderGameState } from '../../helpers/gameState';

// the prompt "name a card" abilities use, such as Galen Erso's
const prompt: DropdownPopup = {
    type: 'dropdown',
    uuid: 'prompt-uuid',
    title: 'Galen Erso',
    options: ['Han Solo', 'Karis Nemik', 'Two & Two'],
    source: PopupSource.PromptState,
};

describe('Dropdown popup', () => {
    const renderPopup = () => renderGameState(<DropdownPopupModal data={prompt} />, loadRenderCapture('board', 'player1'), 'player1');

    const input = () => screen.getByRole<HTMLInputElement>('combobox');
    const doneButton = () => screen.getByRole<HTMLButtonElement>('button', { name: 'Done' });

    const type = (text: string) => {
        // Autocomplete discards text typed while it does not have the focus
        act(() => input().focus());
        fireEvent.change(input(), { target: { value: text } });
    };
    const clickOption = (name: string) => fireEvent.click(screen.getByRole('option', { name }));
    const pickWithKeyboard = () => {
        fireEvent.keyDown(input(), { key: 'ArrowDown' });
        fireEvent.keyDown(input(), { key: 'Enter' });
    };

    it.each(prompt.options)('sends the option clicked: %s', (option) => {
        const { sent } = renderPopup();

        type(option);
        clickOption(option);
        fireEvent.click(doneButton());

        expect(sent.mock.calls).toEqual([[['menuButton', option, prompt.uuid]]]);
    });

    it('sends the option picked with the keyboard', () => {
        const { sent } = renderPopup();

        type('Kar');
        pickWithKeyboard();
        expect(input().value).toBe('Karis Nemik');
        expect(doneButton().disabled).toBe(false);

        fireEvent.click(doneButton());
        expect(sent.mock.calls).toEqual([[['menuButton', 'Karis Nemik', prompt.uuid]]]);
    });

    it('sends the last option picked when a click is followed by the keyboard', () => {
        const { sent } = renderPopup();

        type('Han');
        clickOption('Han Solo');
        type('Kar');
        pickWithKeyboard();
        fireEvent.click(doneButton());

        expect(sent.mock.calls).toEqual([[['menuButton', 'Karis Nemik', prompt.uuid]]]);
    });

    it('sends the option itself when a browser translator has rewritten its text', () => {
        const { sent } = renderPopup();

        type('Han');
        const option = screen.getByRole('option', { name: 'Han Solo' });
        option.innerHTML = '<font><font>Han Solo</font></font>';
        fireEvent.click(option);
        fireEvent.click(doneButton());

        expect(sent.mock.calls).toEqual([[['menuButton', 'Han Solo', prompt.uuid]]]);
    });

    it('cannot be submitted until an option is picked, or once it is cleared', () => {
        renderPopup();
        expect(doneButton().disabled, 'before anything is picked').toBe(true);

        type('Han Solo');
        expect(doneButton().disabled, 'with text typed but nothing picked').toBe(true);

        clickOption('Han Solo');
        expect(doneButton().disabled, 'with an option picked').toBe(false);

        // the icon inside the clear button is what a player's click lands on
        fireEvent.click(screen.getByTestId('CloseIcon'));
        expect(doneButton().disabled, 'once cleared').toBe(true);
    });
});
