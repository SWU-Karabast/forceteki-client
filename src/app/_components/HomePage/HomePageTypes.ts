import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

export interface IHexagonProps {
    backgroundColor: string;
}

export interface IGameInProgressPlayerProps {
    playerImage: string;
}

export interface IPublicGameInProgressProps {
    match: {
        player1Leader: ICardData;
        player1Base: ICardData;
        player2Leader: ICardData;
        player2Base: ICardData;
    };
}

export interface IPublicGamesProps {
    format: string;
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
