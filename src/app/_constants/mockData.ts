export const mockPlayer: Participant = {
	id: "player1",
	type: "player",
	initiative: null,
	deckSize: 50,
	cards: Array.from({ length: 8 }, (_, i) => {
		const unitType = Math.random() > 0.5 ? "ground" : "space";
		return {
			id: i + 1,
			name: `Player Card ${i + 1} (${
				unitType.charAt(0).toUpperCase() + unitType.slice(1)
			})`,
			unitType: unitType,
		};
	}),
	fullDeck: Array.from({ length: 50 }, (_, i) => {
		const unitType = Math.random() > 0.5 ? "ground" : "space";
		return {
			id: i + 1,
			name: `Player Card ${i + 1} (${
				unitType.charAt(0).toUpperCase() + unitType.slice(1)
			})`,
			unitType: unitType,
		};
	}),
};

export const mockOpponent: Participant = {
	id: "opponent1",
	type: "opponent",
	initiative: null,
	deckSize: 50,
	cards: Array.from({ length: 10 }, (_, i) => {
		const unitType = Math.random() > 0.5 ? "ground" : "space";
		return {
			id: i + 11,
			name: `Opponent Card ${i + 1} (${
				unitType.charAt(0).toUpperCase() + unitType.slice(1)
			})`,
			unitType: unitType,
		};
	}),
	fullDeck: Array.from({ length: 50 }, (_, i) => {
		const unitType = Math.random() > 0.5 ? "ground" : "space";
		return {
			id: i + 11,
			name: `Opponent Card ${i + 1} (${
				unitType.charAt(0).toUpperCase() + unitType.slice(1)
			})`,
			unitType: unitType,
		};
	}),
};

export const playerMatches = [
	{
		player1: {
			playerImage: "boba.png",
			hexagonColors: ["#FF5733", "#33FF57", "#3357FF"],
		},
		player2: {
			playerImage: "kylo.png",
			hexagonColors: ["#FF33A6", "#A633FF", "#33FFC4"],
		},
	},
	{
		player1: {
			playerImage: "leia.png",
			hexagonColors: ["#FFA533", "#33FFF5", "#FF3357"],
		},
		player2: {
			playerImage: "fella.jpeg",
			hexagonColors: ["#33A6FF", "#FF5733", "#F5FF33"],
		},
	},
	{
		player1: {
			playerImage: "ladyfella.jpeg",
			hexagonColors: ["#F533FF", "#57FF33", "#33A6FF"],
		},
		player2: {
			playerImage: "boba.png",
			hexagonColors: ["#FFC433", "#FF33A6", "#3357FF"],
		},
	},
	{
		player1: {
			playerImage: "boba.png",
			hexagonColors: ["#FF5733", "#33FF57", "#3357FF"],
		},
		player2: {
			playerImage: "kylo.png",
			hexagonColors: ["#FF33A6", "#A633FF", "#33FFC4"],
		},
	},
	{
		player1: {
			playerImage: "leia.png",
			hexagonColors: ["#FFA533", "#33FFF5", "#FF3357"],
		},
		player2: {
			playerImage: "fella.jpeg",
			hexagonColors: ["#33A6FF", "#FF5733", "#F5FF33"],
		},
	},
	{
		player1: {
			playerImage: "boba.png",
			hexagonColors: ["#FF5733", "#33FF57", "#3357FF"],
		},
		player2: {
			playerImage: "kylo.png",
			hexagonColors: ["#FF33A6", "#A633FF", "#33FFC4"],
		},
	},
	{
		player1: {
			playerImage: "leia.png",
			hexagonColors: ["#FFA533", "#33FFF5", "#FF3357"],
		},
		player2: {
			playerImage: "fella.jpeg",
			hexagonColors: ["#33A6FF", "#FF5733", "#F5FF33"],
		},
	},
	{
		player1: {
			playerImage: "ladyfella.jpeg",
			hexagonColors: ["#F533FF", "#57FF33", "#33A6FF"],
		},
		player2: {
			playerImage: "boba.png",
			hexagonColors: ["#FFC433", "#FF33A6", "#3357FF"],
		},
	},
];

export const articles: Article[] = [
	{
		title: "The Dead Speak!",
		content:
			"The galaxy has heard a mysterious broadcast, a threat of revenge in the sinister voice of the late Emperor Palpatine. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
		date: "05/15",
		image: "/newsboba.png",
		imageAlt: "Placeholder image",
	},
	{
		title: "Second Article",
		content:
			"A new era begins with the reconstruction of the galaxy. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
		date: "06/10",
		image: "/leia.png",
		imageAlt: "Vader placeholder image",
	},
	{
		title: "Third Article",
		content:
			"A new era begins with the reconstruction of the galaxy. Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
		date: "06/10",
		image: "/kylo.png",
		imageAlt: "Vader placeholder image",
	},
];
