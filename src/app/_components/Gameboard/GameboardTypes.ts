export type ParticipantType = "player" | "opponent";

export interface Participant {
	id: string;
	name: string;
	type: ParticipantType;
	initiative: boolean | null;
	deckSize: number;
	cards: GameCardProps[];
	fullDeck: GameCardProps[];
}

export interface ChatDrawerProps {
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	chatHistory: string[];
	chatMessage: string;
	setChatMessage: React.Dispatch<React.SetStateAction<string>>;
	handleChatSubmit: () => void;
	currentRound: number;
}

export interface PlayerCardTrayProps {
	trayPlayer: string;
	handleModalToggle: () => void;
	handleBasicPromptToggle: () => void;
}

export interface OpponentCardTrayProps {
	participant: Participant;
}

export interface BoardProps {
	sidebarOpen: boolean;
	playedGroundCards: {
		player: CardData[];
		opponent: CardData[];
	};
	playedSpaceCards: {
		player: CardData[];
		opponent: CardData[];
	};
	participant: Participant;
}

export interface CardActionTrayProps {
	trayPlayer: string;
	handleBasicPromptToggle?: () => void;
}

export type DeckSize = number;
export interface DeckDiscardProps {
	deckSize: DeckSize;
}

export interface ResourcesProps {
	trayPlayer?: string;
	handleModalToggle?: () => void;
}

export interface ResourcesOverlayProps {
	isModalOpen: boolean;
	handleModalToggle: () => void;
	selectedResourceCards: CardData[];
}

export interface BasicPromptProps {
	isBasicPromptOpen: boolean;
	handleBasicPromptToggle: () => void;
}

export interface CardAreaProps {
	cards: CardData[];
}

export interface SpaceUnitsBoardProps {
	sidebarOpen: boolean;
	playedSpaceCards: {
		player: CardData[];
		opponent: CardData[];
	};
}

export interface GroundUnitsBoardProps {
	sidebarOpen: boolean;
	playedGroundCards: {
		player: CardData[];
		opponent: CardData[];
	};
}

export interface CardData {
	uuid: string;
	id?: number;
	name?: string;
	selected?: boolean;
	disabled?: boolean;
	unitType?: "ground" | "space";
	handleSelect?: () => void;
	path?: string;
	deckSize?: number;
}

export interface GameCardProps {
	card: CardData;
}

export interface LeaderBaseCardProps {
	variant: "base" | "leader";
	selected?: boolean;
	isLobbyView?: boolean;
	handleSelect?: () => void;
	title?: string;
}

export interface PlayerHandProps {
	cards: CardData[];
}