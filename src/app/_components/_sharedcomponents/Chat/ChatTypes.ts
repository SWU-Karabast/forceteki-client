export interface IChatObject {
    id: string;
    name: string;
    label: string;
    uuid: string;
}

export interface IChatMessage {
    name: string;
    email: string;
    message: string;
    type?: string | null;
}

export interface IChatEntry {
    date: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    message: any;
}
export interface IGameChat {
    messages: IChatEntry[];
}
export interface IChatProps {
    chatHistory: IChatEntry[];
    chatMessage: string;
    playerRoll?: number;
    opponentRoll?: number;
    setChatMessage: (message: string) => void;
    handleChatSubmit: () => void;
    muteChat?: boolean;
}
