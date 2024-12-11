export interface IHexagonProps {
	backgroundColor: string;
}

export interface IGameInProgressPlayerProps {
	playerImage: string;
}

export interface IPublicGameInProgressProps {
	match: {
		player1: IGameInProgressPlayerProps;
		player2: IGameInProgressPlayerProps;
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
