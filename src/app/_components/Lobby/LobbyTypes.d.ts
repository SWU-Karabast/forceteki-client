interface PlayersProps {
	participant: Participant;
	isLobbyView?: boolean;
}

interface SetUpProps {
	participant: Participant;
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
