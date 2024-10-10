type ParticipantType = "player" | "opponent";

interface Participant {
	id: string;
	type: ParticipantType;
	deckSize: number;
	cards: FaceCardProps[];
	fullDeck: FaceCardProps[];
}

interface ChatDrawerProps {
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	chatHistory: string[];
	chatMessage: string;
	setChatMessage: React.Dispatch<React.SetStateAction<string>>;
	handleChatSubmit: () => void;
	currentRound: number;
}

interface PlayerCardTrayProps {
	participant: Participant;
	availableCards: FaceCardProps[];
	resourceSelection: boolean;
	availableResources: number;
	totalResources: number;
	selectedResourceCards: FaceCardProps[];
	handleModalToggle: () => void;
	onSelectCard: (card: FaceCardProps) => void;
	setResourceSelection: (active: boolean) => void;
	handlePlayCard: (card: FaceCardProps) => void;
}

interface OpponentCardTrayProps {
	participant: Participant;
}

interface BoardProps {
	sidebarOpen: boolean;
	playedGroundCards: {
		player: FaceCardProps[];
		opponent: FaceCardProps[];
	};
	playedSpaceCards: {
		player: FaceCardProps[];
		opponent: FaceCardProps[];
	};
	participant: Participant;
}

interface CardActionTrayProps {
	activePlayer: ParticipantType;
	availableCards: FaceCardProps[];
	onSelectCard?: (card: FaceCardProps) => void; // Optional, only for player
	resourceSelection?: boolean; // Optional, only for player
	setResourceSelection?: (active: boolean) => void; // Optional, only for player
	availableResources?: number; // Optional, only for player
	totalResources?: number; // Optional, only for player
	selectedResourceCards?: FaceCardProps[]; // Optional, only for player
	handlePlayCard?: (card: FaceCardProps) => void; // Optional, only for player
}

type DeckSize = number;
interface DeckDiscardProps {
	deckSize: number;
}

interface ResourcesProps {
	availableResources: number;
	totalResources: number;
	activePlayer?: ParticipantType;
	handleModalToggle?: () => void;
}

interface ResourcesOverlayProps {
	isModalOpen: boolean;
	handleModalToggle: () => void;
	selectedResourceCards: FaceCardProps[];
}

interface CardAreaProps {
	cards: FaceCardProps[];
}

interface SpaceUnitsBoardProps {
	sidebarOpen: boolean;
	playedSpaceCards: {
		player: FaceCardProps[];
		opponent: FaceCardProps[];
	};
}

interface GroundUnitsBoardProps {
	sidebarOpen: boolean;
	playedGroundCards: {
		player: FaceCardProps[];
		opponent: FaceCardProps[];
	};
}
