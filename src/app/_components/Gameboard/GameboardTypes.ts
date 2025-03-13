import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

export type IParticipantType = 'player' | 'opponent';

export interface IParticipant {
    id: string;
    name: string;
    type: IParticipantType;
    initiative: boolean | null;
    deckSize: number;
    cards: ICardData[];
    fullDeck: ICardData[];
}

export interface IChatDrawerProps {
    sidebarOpen: boolean;
    toggleSidebar: () => void;
}

export interface IPlayerCardTrayProps {
    trayPlayer: string;
    toggleSidebar: () => void;
}

export interface IOpponentCardTrayProps {
    trayPlayer: string;
    preferenceToggle: () => void;
}

export interface IBoardProps {
    sidebarOpen: boolean;
}

export interface IDeckDiscardProps {
    trayPlayer: string;
}

export interface IResourcesProps {
    trayPlayer: string;
}

export interface IUnitsBoardProps {
    sidebarOpen: boolean;
    arena: string;
}

export interface IPlayerHandProps {
    cards: ICardData[];
    clickDisabled?: boolean;
    allowHover?: boolean;
}