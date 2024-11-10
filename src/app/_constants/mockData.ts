import { Article } from "@/app/_components/HomePage/HomePageTypes";
import { Participant } from "@/app/_components/Gameboard/GameboardTypes";

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
			isFaceUp: true,
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
			isFaceUp: true,
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
			isFaceUp: false,
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
			isFaceUp: false,
		};
	}),
};

export const playerMatches = [
	{
		player1: {
			playerImage: "leaders/iden.webp",
			hexagonColors: ["#4689E1", "#454545", "#298F4A"],
		},
		player2: {
			playerImage: "leaders/boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "leaders/han.webp",
			hexagonColors: ["#F7B440", "#FAFADB", "#F7B440"],
		},
		player2: {
			playerImage: "leaders/leia.webp",
			hexagonColors: ["#298F4A", "#FAFADB", "#C82134"],
		},
	},
	{
		player1: {
			playerImage: "leaders/luke.webp",
			hexagonColors: ["#4689E1", "#FAFADB", "#4689E1"],
		},
		player2: {
			playerImage: "leaders/palpatine.webp",
			hexagonColors: ["#298F4A", "#454545", "#3357FF"],
		},
	},
	{
		player1: {
			playerImage: "leaders/sabine.webp",
			hexagonColors: ["#C82134", "#FAFADB", "#298F4A"],
		},
		player2: {
			playerImage: "leaders/vader.webp",
			hexagonColors: ["#C82134", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "leaders/leia.webp",
			hexagonColors: ["#298F4A", "#FAFADB", "#FF3357"],
		},
		player2: {
			playerImage: "leaders/luke.webp",
			hexagonColors: ["#4689E1", "#FAFADB", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "leaders/boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#F7B440"],
		},
		player2: {
			playerImage: "leaders/iden.webp",
			hexagonColors: ["#4689E1", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "leaders/leia.webp",
			hexagonColors: ["#298F4A", "#FAFADB", "#298F4A"],
		},
		player2: {
			playerImage: "leaders/boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#298F4A"],
		},
	},
	{
		player1: {
			playerImage: "leaders/sabine.webp",
			hexagonColors: ["#C82134", "#FAFADB", "#F7B440"],
		},
		player2: {
			playerImage: "leaders/boba.webp",
			hexagonColors: ["#F7B440", "#454545", "#F7B440"],
		},
	},
];
