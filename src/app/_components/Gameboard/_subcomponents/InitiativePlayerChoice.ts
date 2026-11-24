import { OpponentMulliganChoice, OpponentResourceChoice } from '@/app/_constants/constants';

/** The icon shown for a choice the initiative player has made. */
export enum InitiativePlayerChoiceIcon {
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
    label: string;

    /** Unset while the initiative player is still choosing. */
    icon?: InitiativePlayerChoiceIcon;
}

/** The parts of a prompt state the choice is read from. */
interface IPromptStateWithInitiativePlayerChoice {
    opponentResourceChoice?: OpponentResourceChoice;
    opponentMulliganChoice?: OpponentMulliganChoice;
}

const choosing: IInitiativePlayerChoice = { label: 'Initiative player is choosing' };

/** The initiative player's choice the server sent in `promptState`, or undefined in a prompt that has none. */
export const getInitiativePlayerChoice = (promptState?: IPromptStateWithInitiativePlayerChoice): IInitiativePlayerChoice | undefined => {
    switch (promptState?.opponentResourceChoice) {
        case OpponentResourceChoice.NotChosen:
            return choosing;
        case OpponentResourceChoice.Resourced:
            return { label: 'Initiative player resourced a card', icon: InitiativePlayerChoiceIcon.Resource };
        case OpponentResourceChoice.Passed:
            return { label: 'Initiative player skipped resourcing', icon: InitiativePlayerChoiceIcon.NoResource };
    }

    switch (promptState?.opponentMulliganChoice) {
        case OpponentMulliganChoice.NotChosen:
            return choosing;
        case OpponentMulliganChoice.Mulligan:
            return { label: 'Initiative player took a mulligan', icon: InitiativePlayerChoiceIcon.Mulligan };
        case OpponentMulliganChoice.Keep:
            return { label: 'Initiative player kept their hand', icon: InitiativePlayerChoiceIcon.Keep };
    }

    return undefined;
};
