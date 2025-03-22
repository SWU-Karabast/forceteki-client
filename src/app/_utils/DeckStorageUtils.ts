import { DisplayDeck, StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { IDeckData } from '@/app/_utils/fetchDeckData';
import { DeckJSON } from '@/app/_utils/checkJson';
import { v4 as uuid } from 'uuid';
import { IUser } from '@/app/_contexts/UserTypes';

/* Server */
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
                    deckLID: deckData.deckID || uuid(), // Use existing ID or generate new one
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

        return returnedData.deckId;
    } catch (error) {
        console.error('Error saving deck to server:', error);
        throw error;
    }
};

/**
 * Loads decks from the server
 * @param user The current user
 * @returns Promise that resolves to the array of decks
 */
export const loadDecks = async (user: IUser | null): Promise<StoredDeck[]> => {
    try {
        const decks = loadSavedDecks(true);
        const payload = {
            user: user,
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
            const errors = result.errors || {};
            console.log(errors);
            return decks;
        }
        return result;
    } catch (error) {
        console.log(error);
        // Return local decks as fallback
        return loadSavedDecks(false);
    }
};

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
export const saveDeckToLocalStorage = (deckData:IDeckData | DeckJSON | undefined, deckLink: string): void => {
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
            deckLID:deckKey,
            source: deckSource
        };
        // Save back to localStorage
        localStorage.setItem('swu_deck_'+deckKey, JSON.stringify(simplifiedDeckData));
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
 * Updates the favorite status of a deck
 * @param deckID ID of the deck to update
 * @param isFavorite New favorite status
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