export interface IChatEntry {
	date: string;
	message: [{ name: string; email: string | null },string, string];
}
export interface IGameChat {
	messages: IChatEntry[];
}
export interface IChatProps {
	chatHistory: IGameChat;
	chatMessage: string;
	playerRoll?: number;
	opponentRoll?: number;
	setChatMessage: (message: string) => void;
	handleChatSubmit: () => void;
}
