import { Article } from "@/app/_components/HomePage/HomePageTypes";

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

export const articles: Article[] = [
	{
	  title: "Welcome to the Karabast Beta!",
	  content: `
		<p>This is it, the beta version of the new Karabast! We’re thrilled to have you on board. Dive in, explore what’s new, and help shape the future of Karabast with us!</p>
		<p style="margin-bottom:0;"><a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Join our Discord for the latest progress updates and timelines</a>. If you have coding experience, we are always open to new contributors. Info on how to help out can also be found on <a target="_blank" href="https://discord.gg/hKRaqHND4v" style="color:lightblue;">Discord</a>.</p>
	  `,
	  date: "12/25",
	  image: "/beta.png",
	  imageAlt: "Beta Announcement",
	},
  ];