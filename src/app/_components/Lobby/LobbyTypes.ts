export interface IPlayersProps {
	isLobbyView?: boolean;
}

export interface ISetUpProps {
	chatHistory: string[];
	chatMessage: string;
	setChatMessage: (message: string) => void;
	handleChatSubmit: () => void;
}

