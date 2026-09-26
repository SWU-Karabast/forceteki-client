import { ICardData } from '../Cards/CardTypes';

export enum PopupSource {
    PromptState = 'promptstate',
    User = 'user'
}

export type PopupSourceCard = {
    id: string;
    uuid: string;
    name: string;
    setId?: Partial<ICardData['setId']>;
    type: string;
    printedType?: string;
};

export type PopupButton = {
    text: string;
    uuid: string;
    command: string;
    arg: string;
    sourceCard?: PopupSourceCard;
    hasLegalEffects?: boolean;
    selected?: boolean;
    disabled?: boolean;
    // display label rendered in place of `text` by richer prompt UIs (e.g. the ability name on an optional-trigger card button)
    label?: string;
    // number of similar triggers this button represents when several are grouped into one choice
    count?: number;
};

export type PerCardButton = {
    arg: string;
    command: string;
    text: string;
};

export type DefaultPopup = {
    type: 'default';
    uuid: string;
    title: string;
    description?: string;
    buttons: PopupButton[];
    source: PopupSource;
};

export type ActionTriggerPopup = {
    type: 'actionTrigger';
    uuid: string;
    title: string;
    description?: string;
    buttons: PopupButton[];
    source: PopupSource;
};

export type BatchTriggerPopup = {
    type: 'batchTrigger';
    uuid: string;
    title: string;
    sourceCard?: PopupSourceCard;
    remainingCount: number;
    buttons: PopupButton[];
    source: PopupSource;
};

export type OptionalTriggerPopup = {
    type: 'optionalTrigger';
    uuid: string;
    title: string;
    buttons: PopupButton[];
    source: PopupSource;
};

export type SelectCardsPopup = {
    type: 'select';
    uuid: string;
    title: string;
    description?:string;
    cards: ICardData[];
    perCardButtons: PerCardButton[];
    buttons: PopupButton[];
    source: PopupSource;

    /**
     * How a card click is sent to the server. Defaults to 'menuButton' (server-driven
     * displayCards prompts). Use 'cardClicked' when the popup toggles selection of board
     * cards (e.g. selecting a unit's upgrades for a board SelectCardPrompt).
     */
    clickMode?: 'menuButton' | 'cardClicked';

    /**
     * When true, render a single "Close" button that only dismisses the popup client-side
     * (no message sent). Used when confirmation happens via the board's own prompt Done,
     * so this button must not read as committing the action.
     */
    localCloseButton?: boolean;
};

export type PilePopup = {
    type: 'pile';
    uuid: string;
    title: string;
    subtitle?: string;
    cards: ICardData[];
    source: PopupSource;
    buttons: PopupButton[] | null;
};

export type DropdownPopup = {
    type: 'dropdown';
    uuid: string;
    title: string;
    description?: string;
    options: string[];
    source: PopupSource;
};

export type NumberPopup = {
    type: 'number';
    uuid: string;
    title: string;
    description?: string;
    min: number;
    max: number;
    source: PopupSource;
};

export type LeaveGamePopup = {
    type: 'leaveGame';
    uuid: string;
    source: PopupSource;
};

export type WaitDelayPopup = {
    type: 'waitDelay';
    uuid: string;
    title: string;
    description?: string;
    buttons: PopupButton[];
    source: PopupSource;
};
