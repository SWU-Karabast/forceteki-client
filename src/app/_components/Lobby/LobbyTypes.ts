export interface PlayersProps {
	isLobbyView?: boolean;
}

export interface SetUpProps {
	chatHistory: string[];
	chatMessage: string;
	setChatMessage: (message: string) => void;
	handleChatSubmit: () => void;
}

