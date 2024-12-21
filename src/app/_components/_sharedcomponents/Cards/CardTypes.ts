interface ICardSetId {
  set: string;
  number: number;
}

export interface ICardData {
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
  setId: ICardSetId;
  type: string;
}
export interface IServerCardData {
  count: number;
  card: ICardData;
}
export interface IGameCardProps {
  card: ICardData | IServerCardData;
  size?: "standard" | "square";
  onClick?: () => void;
  variant?: "lobby" | "gameboard";
  disabled?: boolean;
}

export interface ILeaderBaseCardProps {
  variant: "base" | "leader";
  selected?: boolean;
  isLobbyView?: boolean;
  handleSelect?: () => void;
  title?: string;
  card: ICardData;
  disabled?: boolean;
}
