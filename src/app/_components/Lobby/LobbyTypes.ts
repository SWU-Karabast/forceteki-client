import { IServerCardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

export interface IPlayersProps {
    isLobbyView?: boolean;
}

export interface IDeckSelectionCardProps {
    readyStatus: boolean;
    owner: boolean;
}

export interface IBo3ScoreCardProps {
    readyStatus: boolean;
    owner: boolean;
}

// Alias for backwards compatibility
export type ISetUpProps = IDeckSelectionCardProps;

export interface ILobbyDeckData {
    leader: IServerCardData[];
    base: IServerCardData[];
    deckCards: IServerCardData[];
    sideboard: IServerCardData[];
}

export interface ILobbyUserProps {
    id: string;
    username: string;
    ready: boolean;
    deck: ILobbyDeckData;
}