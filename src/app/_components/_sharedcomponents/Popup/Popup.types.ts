import { ICardData } from "../Cards/CardTypes";

export type DefaultPopup = {
  type: "default";
  title: string;
  description: string;
  importantAction?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export type SelectCardsPopup = {
  type: "select";
  title: string;
  maxNumber?: number;
  cards: ICardData[];
  onConfirm: (cards: ICardData[]) => void;
};

// Necessary ?
export type SelectFromPilePopup = {
  type: "pile-select";
  pile: ICardData[];
  onConfirm: (cards: ICardData[]) => void;
};

export type PilePopup = {
  type: "pile";
  title: string;
  cards: ICardData[];
};
