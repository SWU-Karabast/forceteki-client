export interface HexagonProps {
	backgroundColor: string;
}

export interface GameInProgressPlayerProps {
	playerImage: string;
	hexagonColors: string[];
}

export interface PublicGameInProgressProps {
	match: {
		player1: GameInProgressPlayerProps;
		player2: GameInProgressPlayerProps;
	};
}

export interface PublicGamesProps {
	format: string;
}

export type Article = {
	title: string;
	content: string;
	date: string;
	image: string;
	imageAlt: string;
};

export interface NewsItemProps {
	article: Article;
}
