import { CardData } from "@/app/_components/_sharedcomponents/Cards/CardTypes";

export type ParticipantType = "player" | "opponent";

export interface Participant {
	id: string;
	name: string;
	type: ParticipantType;
	initiative: boolean | null;
	deckSize: number;
	cards: CardData[];
	fullDeck: CardData[];
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

export interface PlayerHandProps {
	cards: CardData[];
}