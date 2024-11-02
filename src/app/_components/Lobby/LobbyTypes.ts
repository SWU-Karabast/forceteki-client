import { Participant } from "@/app/_components/Gameboard/GameboardTypes";

export interface PlayersProps {
	participant: Participant;
	isLobbyView?: boolean;
}

export interface SetUpProps {
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

export interface DeckProps {
	activePlayer: Participant;
}
