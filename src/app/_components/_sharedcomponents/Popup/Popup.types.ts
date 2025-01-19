import { ICardData } from '../Cards/CardTypes';

export type PopupButton = {
    text: string;
    uuid: string;
    command: string;
    arg: string;
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
};

export type SelectCardsPopup = {
    type: 'select';
    uuid: string;
    title: string;
    description?:string;


    cards: ICardData[];
    perCardButtons: PerCardButton[];
};

export type PilePopup = {
    type: 'pile';
    uuid: string;
    title: string;
    cards: ICardData[];
};

export type DropdownPopup = {
    type: 'dropdown';
    uuid: string;
    title: string;
    description?: string;
    options: string[];
};