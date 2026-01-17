import { useCallback, useRef, useState } from 'react';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

export interface IMessageDelta {
    newMessages: IChatEntry[];
    messageOffset: number;
    totalMessages: number;
}

export interface IMessageRetransmit {
    messages: IChatEntry[];
    startIndex: number;
}

export interface IUseGameMessagesReturn {
    messages: IChatEntry[];
    handleMessageDelta: (delta: IMessageDelta) => { startIndex: number; endIndex: number } | null;
    handleMessageRetransmit: (retransmit: IMessageRetransmit) => void;
    resetMessages: () => void;
    getRetransmitRange: () => { startIndex: number; endIndex: number } | null;
}

/**
 * Hook to manage game messages separately from game state.
 * Handles delta updates from the server and detects gaps that need retransmission.
 */
export const useGameMessages = (): IUseGameMessagesReturn => {
    const [messages, setMessages] = useState<IChatEntry[]>([]);
    const messagesLengthRef = useRef<number>(0);
    const expectedTotalRef = useRef<number>(0);
    const pendingRetransmitRef = useRef<{ startIndex: number; endIndex: number } | null>(null);

    /**
     * Handle incoming message delta from the server.
     * Returns retransmit request info if there's a gap, otherwise null.
     */
    const handleMessageDelta = useCallback((delta: IMessageDelta): { startIndex: number; endIndex: number } | null => {
        const { newMessages, messageOffset, totalMessages } = delta;

        // Update expected total
        expectedTotalRef.current = totalMessages;

        // Simple gap detection for append-only: if offset > current length, we have a gap
        const currentLength = messagesLengthRef.current;
        if (messageOffset > currentLength) {
            const gapInfo = { startIndex: currentLength, endIndex: messageOffset - 1 };
            pendingRetransmitRef.current = gapInfo;
            return gapInfo;
        }

        // No gap - append the new messages
        setMessages((currentMessages) => {
            const updatedMessages = [...currentMessages];
            for (let i = 0; i < newMessages.length; i++) {
                updatedMessages[messageOffset + i] = newMessages[i];
            }
            messagesLengthRef.current = updatedMessages.length;
            return updatedMessages;
        });

        pendingRetransmitRef.current = null;
        return null;
    }, []);

    /**
     * Handle retransmitted messages from the server.
     * Writes messages to the correct array indices.
     */
    const handleMessageRetransmit = useCallback((retransmit: IMessageRetransmit): void => {
        const { messages: retransmittedMessages, startIndex } = retransmit;

        setMessages((currentMessages) => {
            const updatedMessages = [...currentMessages];
            for (let i = 0; i < retransmittedMessages.length; i++) {
                updatedMessages[startIndex + i] = retransmittedMessages[i];
            }
            messagesLengthRef.current = updatedMessages.length;
            return updatedMessages;
        });

        // Clear pending retransmit if this fills the gap
        pendingRetransmitRef.current = null;
    }, []);

    /**
     * Reset messages (e.g., when starting a new game).
     */
    const resetMessages = useCallback((): void => {
        setMessages([]);
        messagesLengthRef.current = 0;
        expectedTotalRef.current = 0;
        pendingRetransmitRef.current = null;
    }, []);

    /**
     * Get the current pending retransmit range if any.
     */
    const getRetransmitRange = useCallback((): { startIndex: number; endIndex: number } | null => {
        return pendingRetransmitRef.current;
    }, []);

    return {
        messages,
        handleMessageDelta,
        handleMessageRetransmit,
        resetMessages,
        getRetransmitRange,
    };
};
