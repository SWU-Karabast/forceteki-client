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

interface UserContextType {
	user: string | null;
	login: (username: string) => void;
	logout: () => void;
}
