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
        player1Leader: ICardData;
        player1Base: ICardData;
        player2Leader: ICardData;
        player2Base: ICardData;
    };
}

export interface ILobby {
    id: string;
    name: string;
    format: SwuGameFormat;
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
};

export interface INewsItemProps {
    article: IArticle;
}
