import { ICardData } from "../Cards/CardTypes";

export type PopupButton = {
  text: string;
  uuid: string;
  command: string;
  arg: string;
};

export type DefaultPopup = {
  type: "default";
  uuid: string;
  title: string;
  promptType?: string;
  description?: string;
  buttons: PopupButton[];
};

export type SelectCardsPopup = {
  type: "select";
  uuid: string;
  title: string;
  maxNumber?: number;
  cards: ICardData[];
  onConfirm: (cards: ICardData[]) => void;
};

// Necessary ?
export type SelectFromPilePopup = {
  type: "pile-select";
  uuid: string;
  pile: ICardData[];
  onConfirm: (cards: ICardData[]) => void;
};

export type PilePopup = {
  type: "pile";
  uuid: string;
  title: string;
  cards: ICardData[];
};
