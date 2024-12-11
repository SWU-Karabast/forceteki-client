import { ICardData } from "@/app/_components/_sharedcomponents/Cards/CardTypes";

export type IParticipantType = "player" | "opponent";

export interface IParticipant {
	id: string;
	name: string;
	type: IParticipantType;
	initiative: boolean | null;
	deckSize: number;
	cards: ICardData[];
	fullDeck: ICardData[];
}

export interface IChatDrawerProps {
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	chatHistory: string[];
	chatMessage: string;
	setChatMessage: React.Dispatch<React.SetStateAction<string>>;
	handleChatSubmit: () => void;
	currentRound: number;
}

export interface IPlayerCardTrayProps {
	trayPlayer: string;
	handleModalToggle: () => void;
	handleBasicPromptToggle: () => void;
}

export interface IOpponentCardTrayProps {
	trayPlayer: string;
}

export interface IBoardProps {
	sidebarOpen: boolean;
}

export interface IDeckDiscardProps {
	trayPlayer: string;
}

export interface IResourcesProps {
	trayPlayer: string;
	handleModalToggle?: () => void;
}

export interface IResourcesOverlayProps {
	isModalOpen: boolean;
	handleModalToggle: () => void;
}

export interface IBasicPromptProps {
	isBasicPromptOpen: boolean;
	handleBasicPromptToggle: () => void;
}

export interface ICardAreaProps {
	cards: ICardData[];
}

export interface IUnitsBoardProps {
	sidebarOpen: boolean;
	arena: string;
}

export interface IPlayerHandProps {
	cards: ICardData[];
}