import { IPreferences, IUser } from '@/app/_contexts/UserTypes';
import {
    loadPreferencesFromLocalStorage,
    savePreferencesToLocalStorage,
    savePreferencesToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { CardImageLocale } from '@/app/_utils/s3Utils';

/**
 * Generic function to save preferences based on user authentication status
 */
export const savePreferencesGeneric = async (
    user: IUser | null,
    partialPreferences: Partial<IPreferences>,
    updateUserPreferences: (preferences: IPreferences) => void
): Promise<{ success: boolean, updatedPreferences: IPreferences }> => {
    if (user) {
        const success = await savePreferencesToServer(user, partialPreferences);

        if (success) {
            // Deep merge for nested objects like sound, cosmetics, keyboardShortcuts, gameOptions
            const updatedUserPreferences = {
                ...user.preferences,
                ...partialPreferences,
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
                }),
                ...(partialPreferences.keyboardShortcuts && {
                    keyboardShortcuts: {
                        ...user.preferences.keyboardShortcuts,
                        ...partialPreferences.keyboardShortcuts
                    } // <--- FIXED: Added closing brace
                }),
                ...(partialPreferences.gameOptions && {
                    gameOptions: {
                        ...user.preferences.gameOptions,
                        ...partialPreferences.gameOptions
                    }
                })
            };

            updateUserPreferences(updatedUserPreferences);

            const currentLocalPreferences = loadPreferencesFromLocalStorage();
            const updatedLocalPreferences = {
                ...currentLocalPreferences,
                ...partialPreferences,
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
                }),
                ...(partialPreferences.keyboardShortcuts && {
                    keyboardShortcuts: {
                        ...currentLocalPreferences.keyboardShortcuts,
                        ...partialPreferences.keyboardShortcuts
                    } // <--- FIXED: Added closing brace
                }),
                ...(partialPreferences.gameOptions && {
                    gameOptions: {
                        ...currentLocalPreferences.gameOptions,
                        ...partialPreferences.gameOptions
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
            }),
            ...(partialPreferences.keyboardShortcuts && {
                keyboardShortcuts: {
                    ...currentPreferences.keyboardShortcuts,
                    ...partialPreferences.keyboardShortcuts
                }
            }),
            ...(partialPreferences.gameOptions && {
                gameOptions: {
                    ...currentPreferences.gameOptions,
                    ...partialPreferences.gameOptions
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
    },
    keyboardShortcuts: {
        passTurn: 'SPACE',
        undo: 'U',
    }, // <--- FIXED: Added closing brace and comma
    gameOptions: {
        muteChat: false,
        cardLanguage: CardImageLocale.English,
    }
});