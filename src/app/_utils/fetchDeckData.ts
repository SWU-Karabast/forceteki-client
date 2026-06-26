// app/_utils/fetchDeckData.ts
import { determineDeckSource, fetchExternalDeckListAsync } from './deckProviders/registry';
import { DeckFetchError, DeckFetchErrorReason } from './deckProviders/core/types';
import { DeckSource } from './deckTypes';

// Re-export so consumers keep a single import path. Note: `DeckSource`,
// `IDeckMetadata`, `IDeckCard`, and `IDeckData` actually live in
// `./deckTypes` to avoid a circular import with `./deckProviders/*`.
// `determineDeckSource` is re-exported from the providers registry so
// existing call sites don't need to change their import.
export { DeckSource, DeckFetchError, DeckFetchErrorReason, determineDeckSource };
export type { IDeckMetadata, IDeckCard, IDeckData } from './deckTypes';

export const fetchDeckData = async (deckLink: string, fetchAll: boolean = true) => {
    try {
        const data = await fetchExternalDeckListAsync(deckLink);

        if (!fetchAll) {
            return data;
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching deck:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
};
