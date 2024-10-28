import { GameCardProps } from "../_sharedcomponents/Cards/CardsTypes";

export type ParticipantType = "player" | "opponent";

export interface Participant {
	id: string;
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
	participant: Participant;
	availableCards: GameCardProps[];
	resourceSelection: boolean;
	availableResources: number;
	totalResources: number;
	selectedResourceCards: GameCardProps[];
	handleModalToggle: () => void;
	onSelectCard: (card: GameCardProps) => void;
	setResourceSelection: (active: boolean) => void;
	handlePlayCard: (card: GameCardProps) => void;
	handleBasicPromptToggle: () => void;
}

export interface OpponentCardTrayProps {
	participant: Participant;
}

export interface BoardProps {
	sidebarOpen: boolean;
	playedGroundCards: {
		player: GameCardProps[];
		opponent: GameCardProps[];
	};
	playedSpaceCards: {
		player: GameCardProps[];
		opponent: GameCardProps[];
	};
	participant: Participant;
}

export interface CardActionTrayProps {
	activePlayer: ParticipantType;
	availableCards: GameCardProps[];
	onSelectCard?: (card: GameCardProps) => void; // Optional, only for player
	resourceSelection?: boolean; // Optional, only for player
	setResourceSelection?: (active: boolean) => void; // Optional, only for player
	availableResources?: number; // Optional, only for player
	totalResources?: number; // Optional, only for player
	selectedResourceCards?: GameCardProps[]; // Optional, only for player
	handlePlayCard?: (card: GameCardProps) => void; // Optional, only for player
	handleBasicPromptToggle?: () => void;
}

export type DeckSize = number;
export interface DeckDiscardProps {
	deckSize: DeckSize;
}

export interface ResourcesProps {
	availableResources: number;
	totalResources: number;
	activePlayer?: ParticipantType;
	handleModalToggle?: () => void;
}

export interface ResourcesOverlayProps {
	isModalOpen: boolean;
	handleModalToggle: () => void;
	selectedResourceCards: GameCardProps[];
}

export interface BasicPromptProps {
	isBasicPromptOpen: boolean;
	handleBasicPromptToggle: () => void;
}

export interface CardAreaProps {
	cards: GameCardProps[];
}

export interface SpaceUnitsBoardProps {
	sidebarOpen: boolean;
	playedSpaceCards: {
		player: GameCardProps[];
		opponent: GameCardProps[];
	};
}

export interface GroundUnitsBoardProps {
	sidebarOpen: boolean;
	playedGroundCards: {
		player: GameCardProps[];
		opponent: GameCardProps[];
	};
}
