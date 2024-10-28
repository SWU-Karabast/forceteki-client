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
