export interface CardData {
  uuid: string;
  id?: number;
  name?: string;
  selected?: boolean;
  selectable: boolean;
  disabled?: boolean;
  unitType?: "ground" | "space";
  handleSelect?: () => void;
  path?: string;
  deckSize?: number;
  power?: number;
  hp?: number;
  cost?: number;
  exhausted?: boolean;
  damage?: number;
}

export interface GameCardProps {
  card: CardData;
  isFaceUp?: boolean;
}

export interface LeaderBaseCardProps {
  variant: "base" | "leader";
  selected?: boolean;
  isLobbyView?: boolean;
  handleSelect?: () => void;
  title?: string;
  card: CardData;
}
