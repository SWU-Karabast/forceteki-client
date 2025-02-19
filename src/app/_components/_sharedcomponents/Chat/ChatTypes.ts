export interface IChatEntry {
    date: string;
    message: [{ name: string; email: string | null },string, string];
}

export interface IChatProps {
    chatHistory: IChatEntry[];
    chatMessage: string;
    playerRoll?: number;
    opponentRoll?: number;
    setChatMessage: (message: string) => void;
    handleChatSubmit: () => void;
}
