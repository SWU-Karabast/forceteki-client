export interface GameCardProps {
	id?: number;
	name?: string;
	selected?: boolean;
	disabled?: boolean;
	unitType?: "ground" | "space";
	handleSelect?: () => void;
	path?: string;
	deckSize?: number;
	isFaceUp: boolean;
}

export interface LeaderBaseCardProps {
	variant: "base" | "leader";
	selected?: boolean;
	isLobbyView?: boolean;
	handleSelect?: () => void;
	title?: string;
}
