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
}

/**
 * Hook to manage game messages separately from game state.
 * Handles delta updates from the server and detects gaps that need retransmission.
 */
export const useGameMessages = (): IUseGameMessagesReturn => {
    const [messages, setMessages] = useState<IChatEntry[]>([]);
    const messagesLengthRef = useRef<number>(0);
    const expectedTotalRef = useRef<number>(0);

    const appendMessages = useCallback((newMessages: IChatEntry[], startIndex: number) => {
        setMessages((currentMessages) => {
            const updatedMessages = [...currentMessages];
            for (let i = 0; i < newMessages.length; i++) {
                updatedMessages[startIndex + i] = newMessages[i];
            }
            messagesLengthRef.current = updatedMessages.length;
            return updatedMessages;
        });
    }, []);

    /**
     * Handle incoming message delta from the server.
     * Returns retransmit request info if there's a gap, otherwise null.
     */
    const handleMessageDelta = useCallback((delta: IMessageDelta): { startIndex: number; endIndex: number } | null => {
        const { newMessages, messageOffset, totalMessages } = delta;

        // Update expected total
        expectedTotalRef.current = totalMessages;

        // Capture length before appending
        const lengthBeforeAppend = messagesLengthRef.current;

        // Always append the new messages
        appendMessages(newMessages, messageOffset);

        // If messageOffset > lengthBeforeAppend, there's a gap - request retransmit
        if (messageOffset > lengthBeforeAppend) {
            return { startIndex: lengthBeforeAppend, endIndex: messageOffset };
        }

        return null;
    }, [appendMessages]);

    /**
     * Handle retransmitted messages from the server.
     * Writes messages to the correct array indices.
     */
    const handleMessageRetransmit = useCallback((retransmit: IMessageRetransmit): void => {
        if (process.env.NODE_ENV === 'development') {
            console.log('handleMessageRetransmit called with:', retransmit);
        }
        const { messages: retransmittedMessages, startIndex } = retransmit;
        appendMessages(retransmittedMessages, startIndex);
    }, [appendMessages]);

    /**
     * Reset messages (e.g., when starting a new game).
     */
    const resetMessages = useCallback((): void => {
        setMessages([]);
        messagesLengthRef.current = 0;
        expectedTotalRef.current = 0;
    }, []);

    return {
        messages,
        handleMessageDelta,
        handleMessageRetransmit,
        resetMessages,
    };
};
