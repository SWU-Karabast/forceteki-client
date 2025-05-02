export type MessageType = 'alert' | 'playerChat' | 'gameLog';

export interface IChatMessageContent {
    id?: string;
    name?: string;
    text?: string;
    type?: MessageType;
    color?: string;
}

export interface IChatEntry {
    date: string;
    message: IChatMessageContent[] | { alert: { message: string[] } };
}

export interface IGameChat {
    messages: IChatEntry[];
}

export interface IChatCardData {
    id: string;
    name: string;
    setId: { set: string; number: number };
    type: string;
    ownerId?: string;
    zone?: string;
}

export interface IChatProps {
    chatHistory: IChatEntry[];
    chatMessage: string;
    playerRoll?: number;
    opponentRoll?: number;
    setChatMessage: (message: string) => void;
    handleChatSubmit: () => void;
    cards?: Record<string, IChatCardData>;
}
