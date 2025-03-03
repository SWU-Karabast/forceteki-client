
export type GameCardData = ICardData | IServerCardData | IOpponentHiddenCardData | IPromptDisplayCardData;

export interface IPreviewCard {
    id: string;
    setId: ICardSetId;
    types: string;
    titleAndSubtitle: string;
}

export interface ICardData {
    uuid: string;
    count?: number;
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
    capturedCards?: ICardData[];
    aspects?: IAspect[];
    sentinel?: boolean;
    types?: string[];
    owner: ICardPlayer;
    controller: ICardPlayer;
    selectionState?: 'viewOnly' | 'selectable' | 'unselectable' | 'selected' | 'invalid';
    zone?: string;
    epicActionSpent?: boolean;
    onStartingSide?: boolean;
    controlled: boolean;
}

export interface IServerCardData {
    count: number;
    id: string;
}
export type ISetCode = {
    setId: {
        set: string;
        number: number;
    }
    type: string;
    types?: string[];
    id: string;
}

export interface IOpponentHiddenCardData {
    facedown: boolean;
    controller: ICardPlayer
    owner: ICardPlayer
    zone: string;

}

interface ICardSetId {
    set: string;
    number: number;
}

type IAspect = 'aggression' | 'command' | 'cunning' | 'heroism' | 'vigilance' | 'villainy';


export interface IPromptDisplayCardData {
    cardUuid: string;
    internalName: string;
    selectionOrder: number;
    selectionState: 'viewOnly' | 'selectable' | 'unselectable' | 'selected' | 'invalid';
    setId: ICardSetId;
}
export interface IGameCardProps {
    card: ICardData;
    onClick?: () => void;
    disabled?: boolean;
    subcards?: ICardData[];
    cardStyle?: CardStyle;
    capturedCards?: ICardData[];
}

export interface ILeaderBaseCardProps {
    selected?: boolean;
    handleSelect?: () => void;
    title?: string;
    card: ICardData | null;
    disabled?: boolean;
    cardStyle?: LeaderBaseCardStyle;
}

export enum CardStyle {
    InPlay = 'inplay',
    Lobby = 'lobby',
    Prompt = 'prompt',
    Plain = 'plain',
}

export enum LeaderBaseCardStyle {
    Leader = 'leader',
    Base = 'base',
    Plain = 'plain',
}

interface ICardPlayer {
    id: string;
    name: string;
    label: string;
    uuid: string;
}
