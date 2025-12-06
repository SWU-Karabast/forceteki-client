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
            // Deep merge for nested objects like sound and cosmetics
            const updatedUserPreferences = {
                ...user.preferences,
                ...partialPreferences,
                // Explicitly handle nested objects
                ...(partialPreferences.sound && {
                    sound: {
                        ...user.preferences.sound,
                        ...partialPreferences.sound
                    }
                }),
                ...(partialPreferences.cosmetics && {
                    cosmetics: {
                        ...user.preferences.cosmetics,
                        ...partialPreferences.cosmetics
                    }
                })
            }
            updateUserPreferences(updatedUserPreferences);

            const currentLocalPreferences = loadPreferencesFromLocalStorage();
            const updatedLocalPreferences = {
                ...currentLocalPreferences,
                ...partialPreferences,
                // Explicitly handle nested objects for localStorage too
                ...(partialPreferences.sound && {
                    sound: {
                        ...currentLocalPreferences.sound,
                        ...partialPreferences.sound
                    }
                }),
                ...(partialPreferences.cosmetics && {
                    cosmetics: {
                        ...currentLocalPreferences.cosmetics,
                        ...partialPreferences.cosmetics
                    }
                })
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
            ...partialPreferences,
            // Explicitly handle nested objects
            ...(partialPreferences.sound && {
                sound: {
                    ...currentPreferences.sound,
                    ...partialPreferences.sound
                }
            }),
            ...(partialPreferences.cosmetics && {
                cosmetics: {
                    ...currentPreferences.cosmetics,
                    ...partialPreferences.cosmetics
                }
            })
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
    cosmetics: {
        cardback: undefined,
        background: undefined,
        // playmat: undefined,
        // disablePlaymats: false,
    }
});