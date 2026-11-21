import type { CardPool, SwuGameFormat } from '@/app/_constants/constants';

export interface ITestDeckButtonProps {
    format: SwuGameFormat;
    cardPool: CardPool;

    /** Receives the test deck as deck JSON, the same text a player could paste into the deck field. */
    onDeck: (deckJson: string) => void;
    disabled?: boolean;
}
