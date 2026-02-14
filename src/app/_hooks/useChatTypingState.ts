import { useRef } from 'react';
import { useGame } from '../_contexts/Game.context';

type TypingState = 'Unchanged' | 'StartedTyping' | 'StoppedTyping'

export const useChatTypingState = () => {
    const { sendMessage } = useGame();
     
    const chatInputRef = useRef('');

    const handleStateOnChange = (inputValue: string) => {
        const typingState = getTypingState(chatInputRef.current, inputValue);

        switch (typingState) {
            case 'StartedTyping':
                sendMessage('typingstate', [true]);
                break;
            case 'StoppedTyping':
                sendMessage('typingstate', [false]);
                break;
            
            default:
                break;
        }
            
        chatInputRef.current = inputValue; 
    }
    
    const resetTypingState = () => {
        chatInputRef.current = ''
        sendMessage('typingstate', [false]);
    };

    const getTypingState = (prev: string, next: string): TypingState => {
        if (!prev && next) return 'StartedTyping';
        if (prev && !next) return 'StoppedTyping';
        return 'Unchanged';
    }

    return {
        handleStateOnChange,
        resetTypingState
    };
}