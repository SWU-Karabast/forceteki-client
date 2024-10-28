import { Participant } from "@/app/_components/Gameboard/GameboardTypes";

export interface LeaderBaseBoardProps {
	participant: Participant;
	isLobbyView?: boolean;
}

export interface LeaderBaseProps {
	participant: string;
	isLobbyView?: boolean;
	title?: string;
}
