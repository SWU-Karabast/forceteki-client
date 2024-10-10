interface BackCardProps {
	deckSize?: number;
}

interface FaceCardProps {
	id?: number;
	name?: string;
	selected?: boolean;
	disabled?: boolean;
	unitType?: "ground" | "space";
	handleSelect?: () => void;
	path?: string;
}

interface LeaderCardProps {
	selected?: boolean;
	isLobbyView?: boolean;
	handleSelect?: () => void;
	title?: string;
}

interface BaseCardProps {
	selected?: boolean;
	isLobbyView?: boolean;
	handleSelect?: () => void;
}

interface LeaderBaseBoardProps {
	participant: Participant;
	isLobbyView?: boolean;
}

interface LeaderBaseProps {
	participant: string;
	isLobbyView?: boolean;
	title?: string;
}

interface ControlHub {
	path?: string;
	sidebarOpen?: boolean;
	toggleSidebar?: () => void;
}

interface DeckProps {
	activePlayer: Participant;
}

interface ChatProps {
	chatHistory: string[];
	chatMessage: string;
	playerRoll?: number;
	opponentRoll?: number;
	setChatMessage: (message: string) => void;
	handleChatSubmit: () => void;
}
