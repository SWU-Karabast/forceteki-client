interface CardSetId {
	set: string;
	number: number;
}

export interface CardData {
	uuid: string;
	id?: number;
	name?: string;
	selected?: boolean;
    selectable: boolean;
	disabled?: boolean;
	unitType?: "ground" | "space";
	handleSelect?: () => void;
	path?: string;
	deckSize?: number;
	power?: number;
	hp?: number;
	cost?: number;
	exhausted?: boolean;
	damage?: number;
	setId: CardSetId;
	type: string;
}

export interface GameCardProps {
	card: CardData;
	size?: "standard" | "square";
}

export interface LeaderBaseCardProps {
	variant: "base" | "leader";
	selected?: boolean;
	isLobbyView?: boolean;
	handleSelect?: () => void;
	title?: string;
	card: CardData;
}