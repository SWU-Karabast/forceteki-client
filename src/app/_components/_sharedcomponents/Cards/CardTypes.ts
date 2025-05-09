
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
    id?: string;
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
    epicDeployActionSpent?: boolean;
    hidden?: boolean;
    isAttacker?: boolean;
    isDefender?: boolean;
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

// Used to handle the how the display of the card should be in the different scenarios
// InPlay - when the card is on the gameboard
// Lobby - When the card is displayed before a game starts
// Prompt - When you need to select a card to choose from an prompt in the game
// Plain - Default display style
export enum CardStyle {
    InPlay = 'inplay',
    Lobby = 'lobby',
    Prompt = 'prompt',
    Plain = 'plain',
    PlainLeader = 'plainLeader'
}

export enum LeaderBaseCardStyle {
    Leader = 'leader',
    Base = 'base',
    Plain = 'plain',
    PlainLeader = 'plainLeader', 
}

interface ICardPlayer {
    id: string;
    name: string;
    label: string;
    uuid: string;
}

export interface IMatchTableStats {
    leaderId: string,
    baseId: string,
    wins: number,
    losses: number,
    winPercentage: number,
    animationComplete?: boolean,
}

// Interface for opponent stats
export interface IMatchupStatEntity {
    leaderId: string;
    baseId: string;
    wins: number;
    losses: number;
    draws: number;
}

// deckpage stats
export interface IDeckPageStats {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
    winPercentage: number;
}

// stats interface
export interface IDeckStats {
    wins: number;
    losses: number;
    draws: number;
    statsByMatchup?: IMatchupStatEntity[];
}

// DeckDetailedData
export interface IDeckDetailedData {
    id: string;
    userId: string;
    deck: {
        leader: { id: string };
        base: { id: string };
        name: string;
        favourite: boolean;
        deckLink: string;
        deckLinkID: string;
        source?: string;
    };
    stats?: IDeckStats;
}

// Define interfaces for deck data
export interface StoredDeck {
    leader: { id: string };
    base: { id: string };
    name: string;
    favourite: boolean;
    deckLink: string;
    deckID:string;
    deckLinkID: string;
    source: 'SWUSTATS' | 'SWUDB'
}

export interface DisplayDeck {
    deckID: string;
    leader: { id: string, types:string[] };
    base: { id: string, types:string[] };
    metadata: { name: string };
    favourite: boolean;
    deckLink: string;
    source: 'SWUSTATS' | 'SWUDB';
}