import { ICardData } from '../Cards/CardTypes';

export enum PopupSource {
    PromptState = 'promptstate',
    User = 'user'
}

export type PopupButton = {
    text: string;
    uuid: string;
    command: string;
    arg: string;
    selected?: boolean;
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

export type SelectCardsPopup = {
    type: 'select';
    uuid: string;
    title: string;
    description?:string;
    cards: ICardData[];
    perCardButtons: PerCardButton[];
    buttons: PopupButton[];
    source: PopupSource;
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

export type LeaveGamePopup = {
    type: 'leaveGame';
    uuid: string;
    source: PopupSource;
};