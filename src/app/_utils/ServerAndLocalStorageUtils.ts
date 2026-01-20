import {
    DisplayDeck,
    IDeckDetailedData,
    StoredDeck
} from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { determineDeckSource, IDeckData } from '@/app/_utils/fetchDeckData';
import { DeckJSON } from '@/app/_utils/checkJson';
import { v4 as uuid } from 'uuid';
import { IUser, IPreferences, IGetUser } from '@/app/_contexts/UserTypes';
import { Session } from 'next-auth';
import { IAnnouncement } from '@/app/_components/HomePage/HomePageTypes';

/* Secondary functions */
/**
 * Fetches decks based on authentication status
 * - For authenticated users: loads from server
 * - For anonymous users: loads from local storage
 *
 * @param SessionUser the session user with userId
 * @param user The current user (or null if anonymous)
 * @param options Configuration options for the fetch operation
 * @returns Promise that resolves to an array of decks in the requested format
 */
export const retrieveDecksForUser = async <T extends 'stored' | 'display' = 'stored'>(
    SessionUser: Session['user'] | undefined,
    user: IUser | null,
    options?: {
        format?: T;
        setDecks?: T extends 'display'
            ? React.Dispatch<React.SetStateAction<DisplayDeck[]>>
            : React.Dispatch<React.SetStateAction<StoredDeck[]>>;
        setFirstDeck?: (firstDeck: string, allDecks: StoredDeck[] | DisplayDeck[]) => void;
    }
) => {
    try {
        // Get decks based on authentication status
        const decks = SessionUser?.userId && user ? await loadDecks(user) : loadSavedDecks();

        // Sort decks with favorites first
        const sortedDecks = decks.sort((a, b) => {
            if (a.favourite && !b.favourite) return -1;
            if (!a.favourite && b.favourite) return 1;
            return 0;
        });

        // Convert to display format if requested
        const finalDecks = options?.format === 'display'
            ? convertToDisplayDecks(sortedDecks) as DisplayDeck[]
            : sortedDecks as StoredDeck[];

        if (options?.setDecks) {
            // we need to use type assertion.
            if (options.format === 'display') {
                (options.setDecks as React.Dispatch<React.SetStateAction<DisplayDeck[]>>)(finalDecks as DisplayDeck[]);
            } else {
                (options.setDecks as React.Dispatch<React.SetStateAction<StoredDeck[]>>)(finalDecks as StoredDeck[]);
            }
        }

        // Set first deck as selected if we have decks and a setter
        if (options?.setFirstDeck && decks.length > 0) {
            options.setFirstDeck(decks[0].deckID, finalDecks);
        }
    } catch (err) {
        console.error('Error fetching decks:', err);
        throw err;
    }
};

/**
 * Gets user information for a payload, using anonymous user if none provided
 * @param {Object} user - Optional user object
 * @return {Object} The user object to use in payloads
 */
export const getUserPayload = (user: IUser | null): object => {
    if (user) {
        return user;
    }

    const anonymousId = localStorage.getItem('anonymousUserId');
    return {
        id: anonymousId,
        username: 'anonymous ' + anonymousId?.substring(0, 6),
    };
}


/* Server */
export const getUserFromServer = async(): Promise<IGetUser> =>{
    try {
        const decks = loadSavedDecks(false);
        // const preferences = loadPreferencesFromLocalStorage();
        const payload = {
            decks: decks,
            // preferences: preferences
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-user`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );
        const result = await response.json();
        if (!response.ok) {
            const errors = result.errors || {};
            console.log(errors);
            throw new Error(errors);
        }
        loadSavedDecks(true);
        savePreferencesToLocalStorage(result.user.preferences);
        return result.user;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const getUsernameChangeInfoFromServer = async(user: IUser): Promise<{
    canChange: boolean;
    message: string;
    typeOfMessage: string;
}> => {
    try {
        const payload = {
            user
        };
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-change-username-info`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get username change information');
        }

        // Format a detailed message with the date if available
        let formattedMessage = data.result.message || '';
        if (data.result.nextChangeAllowedAt) {
            const date = new Date(data.result.nextChangeAllowedAt);
            const formattedDate = date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            formattedMessage += ` (on ${formattedDate})`;
        }

        return {
            canChange: data.result.canChange,
            message: formattedMessage,
            typeOfMessage: data.result.typeOfMessage
        };
    } catch (error) {
        console.error('Error getting username change information:', error);
        throw error;
    }
}

export const setUsernameOnServer = async(user: IUser | null, username: string): Promise<string> => {
    try {
        const payload = {
            newUsername: username,
            user
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/change-username`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }
        return result.username
    }catch (error) {
        console.error(error);
        throw error;
    }
}

export const setWelcomeUpdateMessage = async(user: IUser | null): Promise<boolean> => {
    try {
        const payload = {
            user
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/toggle-welcome-message`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }
        return result
    }catch (error) {
        console.error(error);
        throw error;
    }
}

export const setModerationSeenAsync = async(user: IUser | null): Promise<boolean> => {
    try {
        const payload = {
            user
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/set-moderation-seen`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }
        return result
    }catch (error) {
        console.error(error);
        throw error;
    }
}

export const toggleFavouriteDeck = async(deckId: string, isFavorite: boolean, user: IUser): Promise<void> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/deck/${deckId}/favorite`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                isFavorite,
                user
            }),
            credentials: 'include' // Necessary to include auth cookies
        });

        const data = await response.json();

        if (!data.success) {
            console.error('Failed to toggle deck favorite:', data.message);
            throw new Error(`Failed to toggle deck favorite:${data.message}`);
        }

        return;
    } catch (error) {
        console.error('Error toggling deck favorite:', error);
        if(error instanceof Error && error.message.includes('Authentication error')){
            updateDeckFavoriteInLocalStorage(deckId)
        }else{
            throw error;
        }
    }
}

export const saveDeckToServer = async (deckData: IDeckData | DeckJSON, deckLink: string, user: IUser | null,) => {
    try {
        const payload = {
            user,
            deck: {
                id: deckData.deckID || uuid(), // Use existing ID or generate new one
                userId: user?.id,
                deck: {
                    leader: { id: deckData.leader.id },
                    base: { id: deckData.base.id },
                    name: deckData.metadata?.name || 'Untitled Deck',
                    favourite: false,
                    deckLink: deckLink,
                    deckLinkID: deckData.deckID, // Use existing ID or generate new one
                    source: deckData.deckSource || determineDeckSource(deckLink)
                }
            }
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/save-deck`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        const returnedData = await response.json();
        if (!response.ok) {
            const error = await response.json();
            console.error('Error saving deck to server:', error);
            throw new Error('Error when attempting to save deck. '+ error);
        }
        return returnedData.deck.id;
    } catch (error) {
        console.log(error);
        return null;
    }
};

/**
 * Loads decks from the server
 * @returns Promise that resolves to the array of decks
 */
export const loadDecks = async (user: IUser): Promise<StoredDeck[]> => {
    try {
        const decks = loadSavedDecks(false);
        const payload = {
            user,
            decks: decks
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-decks`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );
        const result = await response.json();
        if (!response.ok) {
            const errors = result.message || {};
            // We check here if the error was a response of not being authenticated which we should handle by loading up
            // localstorage decks if they exist.
            if(response.status === 403){
                return decks;
            }
            throw new Error(errors);
        }
        loadSavedDecks(true);
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const deleteDecks = async (deckIds: string[], user: IUser): Promise<string[]> => {
    try {
        const payload = {
            user,
            deckIds: deckIds
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/delete-decks`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            }
        );
        const result = await response.json();
        if (!response.ok) {
            const errors = result.errors || {};
            console.log(errors);
            if(response.status === 401){
                for(const deck of deckIds){
                    removeDeckFromLocalStorage(deck)
                }
                return [];
            }
            throw new Error('Error when attempting to delete decks. ' + errors);
        }
        return result.removedDeckLinks
    }catch(error) {
        throw error;
    }
}

/**
 * Loads saved decks from localStorage will become depricated at some point.
 * @returns Array of stored decks sorted with favorites first
 */
export const loadSavedDecks = (deleteAfter: boolean = false): StoredDeck[] => {
    try {
        const storedDecks: StoredDeck[] = [];
        // Get all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            // Check if this is a deck key
            if (key && key.startsWith('swu_deck_')) {
                const deckID = key.replace('swu_deck_', '');
                const deckDataJSON = localStorage.getItem(key);

                if (deckDataJSON) {
                    const deckData = JSON.parse(deckDataJSON) as StoredDeck;
                    // Add to our list with the ID for reference
                    storedDecks.push({
                        ...deckData,
                        deckID: deckID
                    });
                }
                // remove afterwards TODO uncomment when we are ready to deploy logins
                /* if(deleteAfter){
                    removeDeckFromLocalStorage(deckID);
                } */
            }
        }
        // Sort to show favorites first
        return [...storedDecks].sort((a, b) => {
            if (a.favourite && !b.favourite) return -1;
            if (!a.favourite && b.favourite) return 1;
            return 0;
        });
    } catch (error) {
        console.error('Error loading decks from localStorage:', error);
        return [];
    }
};

/**
 * Converts stored decks to display format
 * @param storedDecks Array of stored decks
 * @returns Array of display decks
 */
export const convertToDisplayDecks = (storedDecks: StoredDeck[]): DisplayDeck[] => {
    return storedDecks.map(deck => ({
        deckID: deck.deckID || '', // Ensure deckID exists
        leader: { id: deck.leader.id, types: ['leader'] },
        base: { id: deck.base.id, types: ['base'] },
        metadata: { name: deck.name },
        favourite: deck.favourite,
        deckLink: deck.deckLink,
        source: deck.source
    }));
};

/**
 * Saves a deck to localStorage
 * @param deckData Deck data we receive from a deckbuilder
 * @param deckLink Unique url of the decks source
 */
export const saveDeckToLocalStorage = (deckData:IDeckData | DeckJSON | undefined, deckLink: string) => {
    if(!deckData) return;
    try {
        // Save to localStorage
        const deckKey = deckData.deckID;
        const deckSource = determineDeckSource(deckLink);
        const simplifiedDeckData = {
            leader: { id: deckData.leader.id },
            base: { id: deckData.base.id },
            name: deckData.metadata?.name || 'Untitled Deck',
            favourite: false,
            deckLink:deckLink,
            deckLinkID:deckKey,
            deckID: deckKey,
            source: deckSource
        };
        // Save back to localStorage
        localStorage.setItem('swu_deck_'+deckKey, JSON.stringify(simplifiedDeckData));
        return deckKey;
    } catch (error) {
        throw error;
    }
};

/**
 * Removes a deck from localStorage
 * @param deckID ID of the deck to remove
 */
export const removeDeckFromLocalStorage = (deckID: string | string[]): void => {
    try {
        localStorage.removeItem(`swu_deck_${deckID}`);
    } catch (error) {
        console.error(`Error removing deck ${deckID}:`, error);
    }
};

export const convertStoredToDeckDetailedData = (storedDeck: StoredDeck): IDeckDetailedData => {
    return {
        id: storedDeck.deckID,
        userId: '',
        deck:{
            leader: storedDeck.leader,
            base: storedDeck.base,
            name: storedDeck.name,
            favourite: storedDeck.favourite,
            deckLink: storedDeck.deckLink,
            deckLinkID: storedDeck.deckLinkID,
            source: storedDeck.source,
        }
    }
}

/**
 * Retrieves a deck by its ID
 * @param deckId Deck ID to retrieve
 * @param user
 * @returns Promise that resolves to the deck data
 */
export const getDeckFromServer = async (deckId: string, user:IUser): Promise<IDeckDetailedData> => {
    try {
        // Make sure we have an anonymousUserId if needed
        const payload = {
            user
        }
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-deck/${deckId}`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error getting deck:', errorText);
            // we get the deck from localStorage and set the link
            const deckDataJSON = localStorage.getItem('swu_deck_'+deckId);
            if (deckDataJSON && errorText.includes('Authentication error')) {
                return convertStoredToDeckDetailedData(JSON.parse(deckDataJSON) as StoredDeck);
            }
            throw new Error(`Failed to get deck: ${errorText}`);
        }

        const data = await response.json();
        return data.deck;
    } catch (error) {
        console.error('Error getting deck:', error);
        throw error;
    }
};

/**
 * Checks if the user has linked their SWUStats account
 * @param user The current user
 * @returns Promise that resolves to boolean indicating if SWUStats is linked
 */
export const checkSwuStatsLinkStatus = async (
    user: IUser
): Promise<boolean> => {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_ROOT_URL}/api/user/${user.id}/swustatsLink`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            }
        );

        if (!response.ok) {
            // Handle authentication errors gracefully
            if (response.status === 401) {
                return false;
            }
            throw new Error('Failed to check SWUStats link status');
        }

        const result = await response.json();
        return result.linked;
    } catch (error) {
        console.error('Error checking SWUStats link status:', error);
        throw error;
    }
};

/**
 * Checks if the user has linked their SWUBase account
 * @param user The current user
 * @returns Promise that resolves to boolean indicating if SWUBase is linked
 */
export const checkSwubaseLinkStatus = async (
    user: IUser
): Promise<boolean> => {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_ROOT_URL}/api/user/${user.id}/swubaseLink`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                return false;
            }
            throw new Error('Failed to check SWUBase link status');
        }

        const result = await response.json();
        return result.linked;
    } catch (error) {
        console.error('Error checking SWUBase link status:', error);
        throw error;
    }
};

/**
 * Saves sound preferences to the server
 * @param user The current user
 * @param preferences
 * @returns Promise that resolves to boolean indicating success
 */
// Helper function to remove undefined values from nested objects
const removeUndefinedValues = <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues) as T;
    }

    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (value !== undefined) {
            cleaned[key] = removeUndefinedValues(value);
        }
    }
    return cleaned as T;
};

export const savePreferencesToServer = async (
    user: IUser,
    preferences: IPreferences
): Promise<boolean> => {
    try {
        // Remove undefined values to prevent DynamoDB issues
        const cleanedPreferences = removeUndefinedValues(preferences);

        const payload = {
            preferences: cleanedPreferences
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/user/${user.id}/preferences`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to save preferences');
        }

        return result.success;
    } catch (error) {
        console.error('Error saving preferences:', error);
        throw error;
    }
};

/**
 * Saves preferences to localStorage for anonymous users
 * @param preferences The preferences to save
 */
export const savePreferencesToLocalStorage = (preferences: IPreferences): void => {
    try {
        localStorage.setItem('swu_preferences', JSON.stringify(preferences));
    } catch (error) {
        console.error('Error saving preferences to localStorage:', error);
    }
};

/**
 * Loads preferences from localStorage for anonymous users
 * @returns The preferences object or default preferences
 */
export const loadPreferencesFromLocalStorage = (): IPreferences => {
    try {
        const preferencesJSON = localStorage.getItem('swu_preferences');
        if (preferencesJSON) {
            const preferences = JSON.parse(preferencesJSON) as IPreferences;
            // Ensure sound preferences have defaults if missing
            return {
                sound: {
                    muteAllSound: preferences.sound?.muteAllSound ?? false,
                    muteCardAndButtonClickSound: preferences.sound?.muteCardAndButtonClickSound ?? false,
                    muteYourTurn: preferences.sound?.muteYourTurn ?? false,
                    muteChatSound: preferences.sound?.muteChatSound ?? false,
                    muteOpponentFoundSound: preferences.sound?.muteOpponentFoundSound ?? false,
                },
                cosmetics: {
                    cardback: preferences.cosmetics?.cardback,
                    background: preferences.cosmetics?.background,
                    // playmat: preferences.cosmetics?.playmat,
                    // disablePlaymats: preferences.cosmetics?.disablePlaymats ?? false,
                }
            };
        }
    } catch (error) {
        console.error('Error loading preferences from localStorage:', error);
    }

    // Return default preferences if nothing found or error occurred
    return {
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
    };
};


/**
 * Updates the favorite status of a deck
 * @param deckID ID of the deck to update
 * @returns True if successful, false otherwise
 */
export const updateDeckFavoriteInLocalStorage = (deckID: string) => {
    try {
        const storageKey = `swu_deck_${deckID}`;
        const deckDataJSON = localStorage.getItem(storageKey);

        if (deckDataJSON) {
            const deckData = JSON.parse(deckDataJSON) as StoredDeck;
            deckData.favourite = !deckData.favourite;
            localStorage.setItem(storageKey, JSON.stringify(deckData));
        }
    } catch (error) {
        console.error('Error updating favorite status:', error);
    }
};


export const unlinkSwuStatsAsync = async(
    user: IUser | null,
): Promise<boolean> => {
    try {
        const payload = {
            user
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/unlink-swustats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to unlink swustats');
        }
        return result.success;
    } catch (error) {
        console.error('Error unlinking swustats:', error);
        throw error;
    }
};

export const unlinkSwubaseAsync = async(
    user: IUser | null,
): Promise<boolean> => {
    // TODO: check - verify endpoint
    try {
        const payload = {
            user
        };

        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/unlink-swubase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Failed to unlink swubase');
        }
        return result.success;
    } catch (error) {
        console.error('Error unlinking swubase:', error);
        throw error;
    }
};



export const shouldShowAnnouncement = (announcement: IAnnouncement): boolean =>{
    try {
        if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_SHOW_LOCAL_ANNOUNCEMENTS !== 'true') {
            return false;
        }

        const now = new Date();
        const endDate = new Date(announcement.endDate);
        cleanupExpiredAnnouncementKeys();
        if (now > endDate) {
            return false; // Past end date, don't show
        }
        const hasSeenIt = localStorage.getItem(`swu-announcement-${announcement.key}`) !== null;
        return !hasSeenIt;
    }catch(error){
        console.error('Error checking if announcement should be shown:', error);
        return false; // should we display an error?
    }
}

export const markAnnouncementAsSeen = (announcement: IAnnouncement): void => {
    try {
        localStorage.setItem(`swu-announcement-${announcement.key}`, JSON.stringify({ key:announcement.key, endDate:announcement.endDate }));
    } catch (error) {
        console.error('Error marking announcement as seen:', error);
        throw error;
    }
};

/**
* Clean up localStorage by removing seen announcements that are no longer active
* Call this occasionally (e.g., on app start) to keep localStorage clean
*/
export const cleanupExpiredAnnouncementKeys = (): void => {
    try {
        // Check all localStorage keys for announcement keys
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith('swu-announcement-')) {
                // If this announcement is old we remove it from localStorage
                const storedAnnouncement = JSON.parse(<string>localStorage.getItem(key)) as IAnnouncement;
                const now = new Date();
                const endDate = new Date(storedAnnouncement.endDate);
                if (now > endDate) {
                    localStorage.removeItem(key);
                }
            }
        }
    } catch (error) {
        console.error('Error cleaning up expired announcement keys:', error);
    }
};

/**
 * Saves the undo popup seen date to localStorage for anonymous users
 * @param date The date string when the popup was seen
 */
export const saveUndoPopupSeenToLocalStorage = (date: string): void => {
    try {
        localStorage.setItem('undoPopupSeenDate', date);
    } catch (error) {
        console.error('Error saving undo popup seen date to localStorage:', error);
    }
};

/**
 * Gets the undo popup seen date from localStorage for anonymous users
 * @returns The date string when the popup was seen, or null if not seen
 */
export const getUndoPopupSeenFromLocalStorage = (): string | null => {
    try {
        return localStorage.getItem('undoPopupSeenDate');
    } catch (error) {
        console.error('Error getting undo popup seen date from localStorage:', error);
        return null;
    }
};

/**
 * Checks if the user has seen the undo popup, handling both signed-in and anonymous users
 * @param user The current user (or null if anonymous)
 * @returns True if the user has seen the popup, false otherwise
 */
export const hasUserSeenUndoPopup = (user: IUser | null): boolean => {
    if (user) {
        // Signed-in user: check server data
        if (!!user.undoPopupSeenDate) {
            saveUndoPopupSeenToLocalStorage(user.undoPopupSeenDate.toString());
            return true;
        }

        return false;
    } else {
        // Anonymous user: check localStorage
        return !!getUndoPopupSeenFromLocalStorage();
    }
};

/**
 * Marks the undo popup as seen, handling both signed-in and anonymous users
 * @param user The current user (or null if anonymous)
 * @param updateCachedLocalState Optional callback to update local user context state for signed-in users
 * @returns Promise that resolves when the operation is complete (for server calls)
 */
export const markUndoPopupAsSeen = async (user: IUser | null, updateCachedLocalState: () => void): Promise<void> => {
    const currentDate = new Date().toISOString();

    if (user) {
        // Signed-in user: update local state first for immediate UI update
        if (updateCachedLocalState) {
            updateCachedLocalState();
        }

        // Then save to server
        try {
            await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/user/${user.id}/undo-popup-seen`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
        } catch (error) {
            console.error('Failed to mark undo popup as seen on server:', error);
            throw error;
        }
    }

    // save to local storage for both signed-in and anonymous so that a signed-in user doesn't get a repeat
    saveUndoPopupSeenToLocalStorage(currentDate);
};

/**
 * Updates the name of a deck
 * @param deckId The deck ID to update
 * @param newName The new name for the deck
 * @param user The current user (or null if anonymous)
 * @returns Promise that resolves when the update is complete
 */
export const updateDeckName = async (deckId: string, newName: string, user: IUser | null): Promise<void> => {
    if (user) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-deck/${deckId}/rename`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                newName,
                user
            }),
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('Failed to update deck name:', data.message);
            throw new Error(`Failed to update deck name: ${data.message}`);
        }
    } else {
        updateDeckNameInLocalStorage(deckId, newName);
    }
};

/**
 * Updates a deck name in localStorage
 * @param deckId The deck ID to update
 * @param newName The new name for the deck
 */
const updateDeckNameInLocalStorage = (deckId: string, newName: string): void => {
    const deckKey = `swu_deck_${deckId}`;
    const deckDataJSON = localStorage.getItem(deckKey);

    if (deckDataJSON) {
        const deckData = JSON.parse(deckDataJSON) as StoredDeck;
        deckData.name = newName;
        localStorage.setItem(deckKey, JSON.stringify(deckData));
    } else {
        console.error(`Deck with ID ${deckId} not found in localStorage`);
        throw new Error(`Deck with ID ${deckId} not found`);
    }
};