interface ICardSetId {
    set: string;
    number: number;
}

type IAspect = 'aggression' | 'command' | 'cunning' | 'heroism' | 'vigilance' | 'villainy';

export interface ICardData {
    uuid: string;
    parentCardId?: string,
    id?: number;
    name?: string;
    implemented?: boolean;
    selected?: boolean;
    selectable: boolean;
    disabled?: boolean;
    unitType?: 'ground' | 'space';
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
    subcards?: ICardData[];
    aspects?: IAspect[];
    sentinel?: boolean;
    types?: string[];
    owner: ICardPlayer;
    controller: ICardPlayer;
}
export interface IServerCardData {
    count: number;
    card: ICardData;
}
export interface IGameCardProps {
    card: ICardData | IServerCardData;
    size?: 'standard' | 'square';
    onClick?: () => void;
    variant?: 'lobby' | 'gameboard';
    disabled?: boolean;
    subcards?: ICardData[];
}

export interface ILeaderBaseCardProps {
    variant: 'base' | 'leader';
    selected?: boolean;
    isLobbyView?: boolean;
    handleSelect?: () => void;
    title?: string;
    card: ICardData;
    disabled?: boolean;
    size?: 'standard' | 'large';
}

interface ICardPlayer {
    id: string;
    name: string;
    label: string;
    uuid: string;
}