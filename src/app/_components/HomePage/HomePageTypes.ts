import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { SwuGameFormat } from '@/app/_constants/constants';

export interface IHexagonProps {
    backgroundColor: string;
}

export interface IGameInProgressPlayerProps {
    playerImage: string;
}

export interface IPublicGameInProgressProps {
    match: {
        id: string;
        isPrivate: boolean;
        player1Leader: ICardData;
        player1Base: ICardData;
        player2Leader: ICardData;
        player2Base: ICardData;
    };
}

export interface ILobbyCardData {
    id: string;
    count: number;
    internalName: string;
    cost: number | null;
}

export interface ILobbyHost {
    leader: ILobbyCardData;
    base: ILobbyCardData;
}

export interface ILobby {
    id: string;
    name: string;
    format: SwuGameFormat;
    host?: ILobbyHost;
}

export interface IJoinableGameProps {
    lobby: ILobby;
}

export type IArticle = {
    title: string;
    content: string;
    date: string;
    image: string;
    imageAlt: string;
    link?: string;
};

export interface INewsItemProps {
    article: IArticle;
}

export interface IAnnouncement {
    key: string;
    endDate: string;
    title?: string;
    content?: string;
    image?: string;
}


