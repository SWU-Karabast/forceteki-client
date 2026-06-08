import { useEffect, useRef } from 'react';
import { useUser } from '@/app/_contexts/User.context';
import { IKeyboardShortcuts } from '@/app/_contexts/UserTypes';
import { normalizeKeyBinding } from '@/app/_utils/keyboardUtils';

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
    
    // Define the guest check
    const isAnonymous = !user || !user.email;

    // Use a ref so we don't constantly re-bind the event listener on every render
    const callbacksRef = useRef(callbacks);

    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        // THE KILL SWITCH: If they are a guest, abort immediately. Do not attach the listener.
        if (isAnonymous) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // 1. Ignore shortcuts if typing in a chat box or text area
            const isTyping = event.target instanceof HTMLInputElement || 
                             event.target instanceof HTMLTextAreaElement;
            if (isTyping) return;

            const isModifierHeld = event.ctrlKey || event.metaKey || event.altKey;
            const isJustModifierKey = ['Control', 'Meta', 'Alt', 'Shift'].includes(event.key);
            
            // If they are holding a modifier AND pressing a normal key, let the browser handle it!
            if (isModifierHeld && !isJustModifierKey) {
                return;
            }

            // 2. Normalize the raw browser key
            const pressedKey = normalizeKeyBinding(event.key);

            // 3. Get user shortcuts or fallback to defaults
            const shortcuts = user?.preferences?.keyboardShortcuts || {};
            const defaults = getDefaultShortcuts();

            // 4. Check if the pressed key matches any of our registered callbacks
            for (const [action, callback] of Object.entries(callbacksRef.current)) {
                if (!callback) continue;
                
                const actionKey = action as keyof IKeyboardShortcuts;
                
                // NEW LOGIC: Check if the key exists in the user's prefs (even if it's an empty string)
                // If it doesn't exist at all (undefined), THEN fall back to the default.
                const userKey = shortcuts[actionKey];
                const boundKey = userKey !== undefined ? userKey : defaults[actionKey];

                // If boundKey is '' (unbound), this safely fails and ignores the key press
                if (boundKey && pressedKey === boundKey.toUpperCase()) {
                    event.preventDefault();
                    callback();
                    return; 
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [user, isAnonymous]); // Added isAnonymous to dependencies
};
