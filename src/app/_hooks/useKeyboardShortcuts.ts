import { useEffect, useRef } from 'react';
import { useUser } from '@/app/_contexts/User.context';
import { IKeyboardShortcuts } from '@/app/_contexts/UserTypes';

/**
 * Get default keyboard shortcuts
 */
export const getDefaultShortcuts = (): IKeyboardShortcuts => ({
    passTurn: 'SPACE',
    undo: 'U',
});

type ShortcutCallbacks = {
    [K in keyof IKeyboardShortcuts]?: () => void;
};

/**
 * Custom hook to listen for and execute keyboard shortcuts based on user preferences.
 * Uses default shortcuts if the user is anonymous or hasn't set custom bindings.
 */
export const useKeyboardShortcuts = (callbacks: ShortcutCallbacks) => {
    const { user } = useUser();
    
    // Use a ref so we don't constantly re-bind the event listener on every render
    const callbacksRef = useRef(callbacks);

    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // 1. Ignore shortcuts if typing in a chat box or text area
            const isTyping = event.target instanceof HTMLInputElement || 
                             event.target instanceof HTMLTextAreaElement;
            if (isTyping) return;

            // 2. Normalize the raw browser key
            let pressedKey = '';
            if (event.key === ' ') pressedKey = 'SPACE';
            else if (event.key === 'Control') pressedKey = 'CTRL';
            else if (event.key === 'Meta') pressedKey = 'CMD';
            else if (event.key === 'Escape') pressedKey = 'ESC';
            else pressedKey = event.key.toUpperCase();

            // 3. Get user shortcuts or fallback to defaults
            const shortcuts = user?.preferences?.keyboardShortcuts || {};
            const defaults = getDefaultShortcuts();

            // 4. Check if the pressed key matches any of our registered callbacks
            for (const [action, callback] of Object.entries(callbacksRef.current)) {
                if (!callback) continue;
                
                const actionKey = action as keyof IKeyboardShortcuts;
                const boundKey = shortcuts[actionKey] || defaults[actionKey];

                if (boundKey && pressedKey === boundKey.toUpperCase()) {
                    event.preventDefault();
                    callback();
                    return; 
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [user]);
};
