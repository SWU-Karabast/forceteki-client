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
	image: string;
	imageAlt: string;
	title: string;
	content: string;
};

export interface NewsItemProps {
	article: Article;
}
