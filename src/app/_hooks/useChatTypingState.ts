import { useRef } from 'react';
import { useGame } from '../_contexts/Game.context';

enum TypingState {
    StartedTyping,
    StillTyping,
    StoppedTyping
}

export const useChatTypingState = () => {
    const { sendLobbyMessage } = useGame();
     
    const chatInputRef = useRef('');

    const handleTypingStateOnChange = (inputValue: string) => {
        const typingState = getTypingState(chatInputRef.current, inputValue);

        switch (typingState) {
            case TypingState.StartedTyping:
                sendLobbyMessage(['typingState',true]);
                break;
            case TypingState.StoppedTyping:
                sendLobbyMessage(['typingState',false]);
                break;
            
            default:
                break;
        }
            
        chatInputRef.current = inputValue; 
    }
    
    const resetTypingState = () => {
        chatInputRef.current = '';
        sendLobbyMessage(['typingState',false]);
    };

    const getTypingState = (prevInputValue: string, currentInputValue: string): TypingState => {
        if (!prevInputValue && currentInputValue) return TypingState.StartedTyping;
        if (prevInputValue && !currentInputValue) return TypingState.StoppedTyping;
        return TypingState.StillTyping;
    }

    return {
        handleTypingStateOnChange,
        resetTypingState
    };
}