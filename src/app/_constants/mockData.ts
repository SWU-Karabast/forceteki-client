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
			playerImage: "iden.webp",
			hexagonColors: ["#4689E1", "#454545", "#298F4A"],
		},
		player2: {
			playerImage: "boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "han.webp",
			hexagonColors: ["#F7B440", "#FAFADB", "#F7B440"],
		},
		player2: {
			playerImage: "leia.webp",
			hexagonColors: ["#298F4A", "#FAFADB", "#C82134"],
		},
	},
	{
		player1: {
			playerImage: "luke.webp",
			hexagonColors: ["#4689E1", "#FAFADB", "#4689E1"],
		},
		player2: {
			playerImage: "palpatine.webp",
			hexagonColors: ["#298F4A", "#454545", "#3357FF"],
		},
	},
	{
		player1: {
			playerImage: "sabine.webp",
			hexagonColors: ["#C82134", "#FAFADB", "#298F4A"],
		},
		player2: {
			playerImage: "vader.webp",
			hexagonColors: ["#C82134", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "leia.webp",
			hexagonColors: ["#298F4A", "#FAFADB", "#FF3357"],
		},
		player2: {
			playerImage: "luke.webp",
			hexagonColors: ["#4689E1", "#FAFADB", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#F7B440"],
		},
		player2: {
			playerImage: "iden.webp",
			hexagonColors: ["#4689E1", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "leia.webp",
			hexagonColors: ["#298F4A", "#FAFADB", "#298F4A"],
		},
		player2: {
			playerImage: "boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "sabine.webp",
			hexagonColors: ["#C82134", "#FAFADB", "#F7B440"],
		},
		player2: {
			playerImage: "boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#F7B440"],
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
