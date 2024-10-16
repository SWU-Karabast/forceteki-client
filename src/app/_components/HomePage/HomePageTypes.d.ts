interface HexagonProps {
	backgroundColor: string;
}

interface GameInProgressPlayerProps {
	playerImage: string;
	hexagonColors: string[];
}

interface PublicGameInProgressProps {
	match: {
		player1: GameInProgressPlayerProps;
		player2: GameInProgressPlayerProps;
	};
}

interface CreateGameFormProps {
	format: string;
	setFormat: (format: string) => void;
}

interface PublicGamesProps {
	format: string;
}

type Article = {
	title: string;
	content: string;
	date: string;
	image: string;
	imageAlt: string;
};

interface NewsItemProps {
	article: Article;
}
