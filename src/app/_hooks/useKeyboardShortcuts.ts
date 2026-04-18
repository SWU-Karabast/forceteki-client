import { useUser } from '@/app/_contexts/User.context';
import { IKeyboardShortcuts } from '@/app/_contexts/UserTypes';
import { loadPreferencesFromLocalStorage } from '@/app/_utils/ServerAndLocalStorageUtils';
import { useMemo } from 'react';

/**
 * Custom hook to access keyboard shortcuts from user preferences
 * Returns the user's keyboard shortcuts or defaults if not set
 */
export const useKeyboardShortcuts = (): IKeyboardShortcuts => {
    const { user } = useUser();

    const shortcuts = useMemo(() => {
        // If user is authenticated, get shortcuts from user preferences
        if (user?.preferences?.keyboardShortcuts) {
            return user.preferences.keyboardShortcuts;
        }

        // Otherwise, get from localStorage
        const localPreferences = loadPreferencesFromLocalStorage();
        return localPreferences.keyboardShortcuts || getDefaultShortcuts();
    }, [user?.preferences?.keyboardShortcuts]);

    return shortcuts;
};

/**
 * Get default keyboard shortcuts
 */
export const getDefaultShortcuts = (): IKeyboardShortcuts => ({
    passTurn: 'SPACE',
    undo: 'U',
});
