export interface ChatProps {
	chatHistory: string[];
	chatMessage: string;
	playerRoll?: number;
	opponentRoll?: number;
	setChatMessage: (message: string) => void;
	handleChatSubmit: () => void;
}
