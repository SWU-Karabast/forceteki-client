import { OpponentMulliganChoice, OpponentResourceChoice } from '@/app/_constants/constants';

/** The icon shown with what the initiative player has chosen, or while they choose. */
export enum InitiativePlayerChoiceIcon {

    /** Animated dots, while the initiative player is still choosing. */
    Choosing = 'choosing',
    Resource = 'resource',
    NoResource = 'noResource',
    Mulligan = 'mulligan',
    Keep = 'keep',
}

/**
 * What the player with the initiative has chosen so far, as the player without it is shown it in a prompt where the player
 * with the initiative chooses first: the mulligan and the regroup phase's resource step.
 */
export interface IInitiativePlayerChoice {

    /** Whether the initiative player is still choosing. */
    isChoosing: boolean;

    /** The text of the row under the prompt's own text. */
    label: string;

    /** Further text beside the label. */
    hint?: string;

    icon?: InitiativePlayerChoiceIcon;

    /**
     * While the initiative player is choosing, what the board's prompt says in place of its own text. The prompt is then
     * drawn as a waiting prompt, since the player is in effect waiting on the initiative player, and the label under it
     * says they need not wait.
     */
    waitingTitle?: string;
}

/** The parts of a prompt state the choice is read from. */
interface IPromptStateWithInitiativePlayerChoice {
    opponentResourceChoice?: OpponentResourceChoice;
    opponentMulliganChoice?: OpponentMulliganChoice;
}

// the player may act without waiting for the initiative player
const CHOOSING_HINT = 'You can choose now or wait for them to decide';

/** The initiative player's choice the server sent in `promptState`, or undefined in a prompt that has none. */
export const getInitiativePlayerChoice = (promptState?: IPromptStateWithInitiativePlayerChoice): IInitiativePlayerChoice | undefined => {
    switch (promptState?.opponentResourceChoice) {
        case OpponentResourceChoice.NotChosen:
            return { isChoosing: true, waitingTitle: 'Waiting for opponent to resource', label: CHOOSING_HINT };
        case OpponentResourceChoice.Resourced:
            return { isChoosing: false, label: 'Initiative player resourced a card', icon: InitiativePlayerChoiceIcon.Resource };
        case OpponentResourceChoice.Passed:
            return { isChoosing: false, label: 'Initiative player skipped resourcing', icon: InitiativePlayerChoiceIcon.NoResource };
    }

    switch (promptState?.opponentMulliganChoice) {
        case OpponentMulliganChoice.NotChosen:
            return { isChoosing: true, label: 'Initiative player is choosing', hint: CHOOSING_HINT, icon: InitiativePlayerChoiceIcon.Choosing };
        case OpponentMulliganChoice.Mulligan:
            return { isChoosing: false, label: 'Initiative player took a mulligan', icon: InitiativePlayerChoiceIcon.Mulligan };
        case OpponentMulliganChoice.Keep:
            return { isChoosing: false, label: 'Initiative player kept their hand', icon: InitiativePlayerChoiceIcon.Keep };
    }

    return undefined;
};
