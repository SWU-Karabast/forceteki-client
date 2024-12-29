export interface IPlayersProps {
	isLobbyView?: boolean;
}
export interface ISetUpProps {
	readyStatus: boolean;
	owner: boolean;
}

export interface IDeckData {
	leader: IServerCardData[];
	base: IServerCardData[];
	deckCards: IServerCardData[];
	sideboard: IServerCardData[];
}

interface ICardSetId {
	set: string;
	number: number;
}

type IAspect =  'aggression' | 'command' | 'cunning' | 'heroism' | 'vigilance' | 'villainy';

export interface ICardData {
	uuid: string;
	parentCardId?: string,
	id?: number;
	name?: string;
	selected?: boolean;
	selectable: boolean;
	disabled?: boolean;
	unitType?: "ground" | "space";
	handleSelect?: () => void;
	path?: string;
	deckSize?: number;
	power?: number;
	hp?: number;
	cost?: number;
	exhausted?: boolean;
	damage?: number;
	setId: ICardSetId;
	type: string;
	subcards?: ICardData[];
	aspects?: IAspect[];
	sentinel?: boolean;
}
export interface IServerCardData {
	count: number;
	card: ICardData;
}

export interface ILobbyUserProps {
	id: string;
	username: string;
	ready: boolean;
	deck: IDeckData;
	owner: boolean;
}