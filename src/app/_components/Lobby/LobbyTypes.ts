export interface PlayersProps {
	isLobbyView?: boolean;
}

export interface SetUpProps {
	chatHistory: string[];
	chatMessage: string;
	playerRoll: number;
	opponentRoll: number;
	isRolling: boolean;
	isRollSame: boolean;
	setChatMessage: (message: string) => void;
	handleChatSubmit: () => void;
	handleRollInitiative: () => void;
}

