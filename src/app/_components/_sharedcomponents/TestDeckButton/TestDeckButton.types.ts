import type { ReactNode } from 'react';
import type { CardPool, SwuGameFormat } from '@/app/_constants/constants';

export interface ITestDeckButtonProps {
    format: SwuGameFormat;
    cardPool: CardPool;

    /** The button's text, saying what it does with the deck, e.g. "Queue With Test Deck". */
    label: string;

    /** Shown beside the button in an info tooltip. */
    tooltip: string;

    /**
     * Receives the test deck as deck JSON, the same text a player could paste into the deck field, and uses it (joins
     * the queue, opens a lobby, imports it). The button stays busy until this settles.
     */
    onDeck: (deckJson: string) => void | Promise<void>;
    disabled?: boolean;

    /** The form's own submit button, which the test deck button sits to the right of, in one row. */
    children: ReactNode;
}
