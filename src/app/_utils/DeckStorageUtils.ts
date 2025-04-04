import { DisplayDeck, IDeckDetailedData, StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { IDeckData } from '@/app/_utils/fetchDeckData';
import { DeckJSON } from '@/app/_utils/checkJson';
import { v4 as uuid } from 'uuid';
import { IUser } from '@/app/_contexts/UserTypes';

/* Server */
export const getUserFromServer = async(): Promise<{ id: string, username: string }> =>{
    try {
        const decks = loadSavedDecks(false);
        const payload = {
            decks: decks
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
        return result.user;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const toggleFavouriteDeck = async(deckId: string, isFavorite: boolean): Promise<void> => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/deck/${deckId}/favorite`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                isFavorite
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
        throw error;
    }
}

export const saveDeckToServer = async (deckData: IDeckData | DeckJSON, deckLink: string, user: IUser | null,) => {
    try {
        const payload = {
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
                    source: deckData.deckSource || (deckLink.includes('swustats.net') ? 'SWUSTATS' : 'SWUDB')
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
        throw error;
    }
};

/**
 * Loads decks from the server
 * @param user The current user
 * @returns Promise that resolves to the array of decks
 */
export const loadDecks = async (): Promise<StoredDeck[]> => {
    try {
        const decks = loadSavedDecks(false);
        const payload = {
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
            console.log(errors);
            alert(errors);
            return decks;
        }
        loadSavedDecks(true);
        return result;
    } catch (error) {
        console.log(error);
        throw error;
    }
};

export const deleteDecks = async (deckIds: string[]): Promise<void> => {
    try {
        const payload = {
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
            throw new Error('Error when attempting to delete decks. ' + errors);
        }
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
                // remove afterwards
                if(deleteAfter){
                    removeDeckFromLocalStorage(deckID);
                }
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
        const deckSource = deckLink.includes('swustats.net') ? 'SWUSTATS' : 'SWUDB'
        const simplifiedDeckData = {
            leader: { id: deckData.leader.id },
            base: { id: deckData.base.id },
            name: deckData.metadata?.name || 'Untitled Deck',
            favourite: false,
            deckLink:deckLink,
            deckLinkID:deckKey,
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

/**
 * Retrieves a deck by its ID
 * @param deckId Deck ID to retrieve
 * @returns Promise that resolves to the deck data
 */
export const getDeckFromServer = async (deckId: string | string[]): Promise<IDeckDetailedData> => {
    try {
        // Make sure we have an anonymousUserId if needed

        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-deck/${deckId}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error getting deck:', errorText);
            throw new Error(`Failed to get deck: ${errorText}`);
        }

        const data = await response.json();
        return data.deck;
    } catch (error) {
        console.error('Error getting deck:', error);
        throw error;
    }
};