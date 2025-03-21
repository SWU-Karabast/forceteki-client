import { DisplayDeck, StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { IDeckData } from '@/app/_utils/fetchDeckData';
import { DeckJSON } from '@/app/_utils/checkJson';

/**
 * Loads saved decks from localStorage
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