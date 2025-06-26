export interface IChatObject {
    id: string;
    name: string;
    label: string;
    uuid: string;
    setId?: {
        set: string;
        number: number;
    };
    controllerId?: string;
}

export interface IAlertMessage {
    alert: {
        type: 'notification' | 'warning' | 'danger' | 'readyStatus';
        message: (IChatObject | string | number)[];
    };
}

export interface IPlayerChatMessage {
    type: 'playerChat';
    id: string;
    name: string;
}

export type IChatMessageContent = IAlertMessage | (IPlayerChatMessage | string | number)[] | (IChatObject | string | number)[];

export interface IChatEntry {
    date: string;
    message: IChatMessageContent;
}

export interface IGameChat {
    messages: IChatEntry[];
}

export interface IChatProps {
    chatHistory: IChatEntry[];
    chatMessage: string;
    setChatMessage: (message: string) => void;
    handleChatSubmit: () => void;
}
