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
