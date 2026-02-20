import { useRef } from 'react';
import { useGame } from '../_contexts/Game.context';

enum TypingState {
    Unchanged,
    StartedTyping,
    StoppedTyping
}

export const useChatTypingState = () => {
    const { sendLobbyMessage } = useGame();
     
    const chatInputRef = useRef('');

    const handleTypingStateOnChange = (inputValue: string) => {
        const typingState = getTypingState(chatInputRef.current, inputValue);

        switch (typingState) {
            case TypingState.StartedTyping:
                sendLobbyMessage(['typingstate',true]);
                break;
            case TypingState.StoppedTyping:
                sendLobbyMessage(['typingstate',false]);
                break;
            
            default:
                break;
        }
            
        chatInputRef.current = inputValue; 
    }
    
    const resetTypingState = () => {
        chatInputRef.current = '';
        sendLobbyMessage(['typingstate',false]);
    };

    const getTypingState = (prevInputValue: string, currentInputValue: string): TypingState => {
        if (!prevInputValue && currentInputValue) return TypingState.StartedTyping;
        if (prevInputValue && !currentInputValue) return TypingState.StoppedTyping;
        return TypingState.Unchanged;
    }

    return {
        handleTypingStateOnChange,
        resetTypingState
    };
}