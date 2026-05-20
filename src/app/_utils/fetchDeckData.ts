// app/_utils/fetchDeckData.ts
import { DeckSource } from './deckTypes';
import type { IDeckData } from './deckTypes';
import { fetchExternalDeckListAsync } from './deckProviders/registry';
import { DeckFetchError, DeckFetchErrorReason } from './deckProviders/types';

// Re-export so consumers keep a single import path. Note: `DeckSource`,
// `IDeckMetadata`, `IDeckCard`, and `IDeckData` actually live in
// `./deckTypes` to avoid a circular import with `./deckProviders/*`.
export { DeckSource, DeckFetchError, DeckFetchErrorReason };
export type { IDeckMetadata, IDeckCard, IDeckData } from './deckTypes';

export const fetchDeckData = async (deckLink: string, fetchAll: boolean = true) => {
    try {
        const source = determineDeckSource(deckLink);
        let data: IDeckData;

        if (source === DeckSource.SWUDB) {
            const SWUDB_NAME = 'swudb.com';
            // swudb.com deck resolution lives on the BE; all other
            // deck-builders are now resolved directly in the browser via the
            // per-provider modules under `_utils/deckProviders`.
            let response: Response;
            try {
                response = await fetch(
                    `${process.env.NEXT_PUBLIC_ROOT_URL}/api/resolve-deck-link`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deckLink }),
                        credentials: 'include'
                    }
                );
            } catch (e) {
                const message = e instanceof Error ? e.message : 'Network error';
                throw new DeckFetchError(
                    DeckFetchErrorReason.NetworkError,
                    `Network error: ${message}`,
                    undefined,
                    SWUDB_NAME,
                );
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message = errorData?.error ?? `Failed to fetch deck: ${response.status}`;
                if (response.status === 403) {
                    throw new DeckFetchError(DeckFetchErrorReason.Private, message, response.status, SWUDB_NAME);
                }
                if (response.status === 404) {
                    throw new DeckFetchError(DeckFetchErrorReason.NotFound, message, response.status, SWUDB_NAME);
                }
                throw new DeckFetchError(DeckFetchErrorReason.ProviderError, message, response.status, SWUDB_NAME);
            }
            const body = await response.json();
            data = {
                ...(body.deck as IDeckData),
                deckSource: DeckSource.SWUDB,
            };
        } else {
            data = await fetchExternalDeckListAsync(deckLink);
        }

        if (!fetchAll){
            return data;
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching deck:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error // or throw error again
    }
};

export const determineDeckSource = (deckLink: string): DeckSource => {
    if (deckLink.includes('swustats.net')) {
        return DeckSource.SWUStats;
    } else if (deckLink.includes('swudb.com')) {
        return DeckSource.SWUDB;
    } else if (deckLink.includes('sw-unlimited-db.com')) {
        return DeckSource.SWUnlimitedDB;
    } else if (deckLink.includes('swubase.com')) {
        return DeckSource.SWUBase;
    } else if (deckLink.includes('swucardhub.fr')) {
        return DeckSource.SWUCardHub;
    } else if (deckLink.includes('swumetastats.com')) {
        return DeckSource.SWUMetaStats;
    } else if (deckLink.includes('my-swu.com')) {
        return DeckSource.MySWU;
    } else if (deckLink.includes('protectthepod.com')) {
        return DeckSource.ProtectThePod;
    } else if (deckLink.includes('swuforge.com')) {
        return DeckSource.SWUForge;
    } else if (deckLink.includes('kyberdecks.com')) {
        return DeckSource.KyberDecks;
    } else if (deckLink.includes('cardcore.gg')) {
        return DeckSource.CardCore;
    } else if (deckLink.includes('holoscan.net')) {
        return DeckSource.HoloScan;
    }

    // Default fallback
    return DeckSource.NotSupported;
}
