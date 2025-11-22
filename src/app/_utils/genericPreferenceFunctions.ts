import { IPreferences, IUser } from '@/app/_contexts/UserTypes';
import {
    loadPreferencesFromLocalStorage,
    savePreferencesToLocalStorage,
    savePreferencesToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';

/**
 * Generic function to save preferences based on user authentication status
 * @param user The current user (authenticated or null for anonymous)
 * @param partialPreferences The preferences to save/update
 * @param updateUserPreferences Function to update the user context
 * @returns Promise<{success: boolean, updatedPreferences: IPreferences}>
 */
// TODO Expand this to make it more generalized later on
export const savePreferencesGeneric = async (
    user: IUser | null,
    partialPreferences: Partial<IPreferences>,
    updateUserPreferences: (preferences: IPreferences) => void
): Promise<{ success: boolean, updatedPreferences: IPreferences }> => {
    if (user) {
        const success = await savePreferencesToServer(user, partialPreferences);

        if (success) {
            // Update user context
            const updatedUserPreferences = {
                ...user.preferences,
                ...partialPreferences
            }
            updateUserPreferences(updatedUserPreferences);

            const currentLocalPreferences = loadPreferencesFromLocalStorage();
            const updatedLocalPreferences = {
                ...currentLocalPreferences,
                ...partialPreferences
            };
            savePreferencesToLocalStorage(updatedLocalPreferences);

            return { success: true, updatedPreferences: updatedUserPreferences };
        } else {
            return { success: false, updatedPreferences: user.preferences || getDefaultPreferences() };
        }
    } else {
        const currentPreferences = loadPreferencesFromLocalStorage();
        const updatedPreferences = {
            ...currentPreferences,
            ...partialPreferences
        };

        savePreferencesToLocalStorage(updatedPreferences);
        return { success: true, updatedPreferences };
    }
};

const getDefaultPreferences = (): IPreferences => ({
    sound: {
        muteAllSound: false,
        muteCardAndButtonClickSound: false,
        muteYourTurn: false,
        muteChatSound: false,
        muteOpponentFoundSound: false,
    },
    animations: {
        disableAnimations: false,
        onlyDamageAnimations: false,
    }
});