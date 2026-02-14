export enum ChatObjectType {
    Player = 'player',
    Card = 'card',
}

export interface IChatObject {
    id: string;
    name: string;
    label: string;
    uuid: string;
    type: ChatObjectType;
    setId?: {
        set: string;
        number: number;
    };
    controllerId?: string;
    printedType?: string;
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

// Player chat message array: first element is player info, rest is message content
export type IPlayerChatMessageArray = [IPlayerChatMessage, ...(string | number)[]];

export type IChatMessageContent = IAlertMessage | IPlayerChatMessageArray | (IChatObject | string | number)[];

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
    handleChatOnChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleChatSubmit: () => void;
}

export interface UserTypingState {
    username: string;
    isTyping: boolean;
}
