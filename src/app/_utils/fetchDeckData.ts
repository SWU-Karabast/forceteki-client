// app/_utils/fetchDeckData.ts

export interface IDeckMetadata {
    name: string;
    author?: string;
}

export interface IDeckCard {
    id: string;
    count: number;
}

export enum DeckSource {
    NotSupported = 'NotSupported',
    SWUStats = 'SWUStats',
    SWUDB = 'SWUDB',
    SWUnlimitedDB = 'SWUnlimitedDB',
    SWUCardHub = 'SWUCardHub',
    SWUBase = 'SWUBase',
    SWUMetaStats = 'SWUMetaStats',
    MySWU = 'MySWU',
    ProtectThePod = 'ProtectThePod',
}

export interface IDeckData {
    metadata: IDeckMetadata;
    leader: IDeckCard;
    secondleader: IDeckCard | null;
    base: IDeckCard;
    deck: IDeckCard[];
    sideboard: IDeckCard[];
    deckSource: DeckSource;
    deckID: string;
    deckLink: string;
    isPresentInDb?: boolean;
}

interface IDeckApiInfo {
    apiUrl: string;
    deckSource: DeckSource;
    deckId: string;
}

/**
 * Parses a deck link and returns the external API URL, deck source, and deck identifier.
 * Throws on invalid or unsupported links.
 */
const resolveDeckApi = (deckLink: string): IDeckApiInfo => {
    if (deckLink.includes('swustats.net')) {
        const gameNameMatch = deckLink.match(/gameName=([^&]+)/);
        const gameName = gameNameMatch ? gameNameMatch[1] : null;
        if (!gameName) {
            throw new Error('Invalid deckLink format');
        }
        return {
            apiUrl: `https://swustats.net/TCGEngine/APIs/LoadDeck.php?deckID=${gameName}&format=json&setId=true`,
            deckSource: DeckSource.SWUStats,
            deckId: gameName,
        };
    }

    if (deckLink.includes('swudb.com')) {
        const match = deckLink.match(/\/([^\/]+)\/?$/);
        const deckId = match ? match[1] : null;
        if (!deckId) {
            throw new Error('Invalid deckLink format');
        }
        return {
            apiUrl: `https://swudb.com/api/getDeckJson/${deckId}`,
            deckSource: DeckSource.SWUDB,
            deckId,
        };
    }

    if (deckLink.includes('sw-unlimited-db.com')) {
        const match = deckLink.match(/\/decks\/(\d+)\/?$/);
        const deckId = match ? match[1] : null;
        if (!deckId) {
            throw new Error('Invalid deckLink format');
        }
        return {
            apiUrl: `https://sw-unlimited-db.com/umbraco/api/deckapi/get?id=${deckId}`,
            deckSource: DeckSource.SWUnlimitedDB,
            deckId,
        };
    }

    if (deckLink.includes('swucardhub.fr')) {
        const match = deckLink.match(/\/Karabast\/(\d+)\/?$/);
        const deckId = match ? match[1] : null;
        if (!deckId) {
            throw new Error('Invalid deckLink format');
        }
        return {
            apiUrl: `https://swucardhub.fr/Karabast/${deckId}`,
            deckSource: DeckSource.SWUCardHub,
            deckId,
        };
    }

    if (deckLink.includes('swubase.com')) {
        const match = deckLink.match(/\/decks\/([^\/]+)\/?$/);
        const deckId = match ? match[1] : null;
        if (!deckId) {
            throw new Error('Invalid deckLink format');
        }
        return {
            apiUrl: `https://swubase.com/api/deck/${deckId}/json`,
            deckSource: DeckSource.SWUBase,
            deckId,
        };
    }

    if (deckLink.includes('swumetastats.com')) {
        const match = deckLink.match(/\/decklists\/([^\/]+)\/?$/);
        const deckId = match ? match[1] : null;
        if (!deckId) {
            throw new Error('Invalid deckLink format');
        }
        return {
            apiUrl: `https://www.swumetastats.com/api/decklists/${deckId}/json`,
            deckSource: DeckSource.SWUMetaStats,
            deckId,
        };
    }

    if (deckLink.includes('my-swu.com')) {
        const withoutQuery = deckLink.split('?')[0];
        const match = withoutQuery.match(/\/decks\/(?:me\/|explore\/[^\/]+\/)?([^\/]+)\/?$/);
        const deckId = match ? match[1] : null;
        if (!deckId) {
            throw new Error('Invalid deckLink format');
        }
        return {
            apiUrl: `https://my-swu.com/api/decks/${deckId}/json`,
            deckSource: DeckSource.MySWU,
            deckId,
        };
    }

    if (deckLink.includes('protectthepod.com')) {
        const url = new URL(deckLink);
        const pathMatch = url.pathname.match(/\/pool\/([a-zA-Z0-9_-]+)/);
        if (!pathMatch || !pathMatch[1]) {
            throw new Error('Invalid deckLink format. Share a pool or deck builder link from protectthepod.com.');
        }
        const shareId = pathMatch[1];
        return {
            apiUrl: `https://protectthepod.com/api/pools/${encodeURIComponent(shareId)}/deck.json`,
            deckSource: DeckSource.ProtectThePod,
            deckId: shareId,
        };
    }

    throw new Error('Deckbuilder not supported');
};

/**
 * Maps an HTTP error response from an external deck API to a user-friendly error message.
 * Throws an Error with the appropriate message.
 */
const handleDeckApiError = (deckSource: DeckSource, status: number, statusText: string): never => {
    switch (deckSource) {
        case DeckSource.SWUStats:
            if (status === 404 || status === 500) {
                throw new Error('Deck not found. Make sure the deck exists on swustats.net.');
            }
            break;
        case DeckSource.SWUDB:
            if (status === 403) {
                throw new Error('403: Deck is set to Private. Change deck to unlisted on swudb');
            }
            if (status === 404) {
                throw new Error('Deck not found. Make sure the deck exists on swudb.com.');
            }
            break;
        case DeckSource.SWUnlimitedDB:
            if (status === 404) {
                throw new Error('Deck not found. Make sure it is set to Published on sw-unlimited-db.');
            }
            break;
        case DeckSource.SWUCardHub:
            if (status === 404) {
                throw new Error('Deck not found. Make sure it is set to Published on swucardhub.fr.');
            }
            break;
        case DeckSource.SWUBase:
            if (status === 404) {
                throw new Error('403: Deck not found. Make sure the deck is set to Public on swubase.com.');
            }
            break;
        case DeckSource.MySWU:
            if (status === 404) {
                throw new Error('403: Deck not found. Make sure the deck is set to Public or Unlisted on my-swu.com.');
            }
            break;
        case DeckSource.ProtectThePod:
            if (status === 400) {
                throw new Error('No deck has been built for this pool yet. Build a deck on protectthepod.com first, then share the link.');
            }
            if (status === 404) {
                throw new Error('Pool not found on protectthepod.com.');
            }
            break;
    }

    throw new Error(`${deckSource} API error: ${statusText}`);
};

export const fetchDeckData = async (deckLink: string, fetchAll: boolean = true) => {
    try {
        const { apiUrl, deckSource, deckId } = resolveDeckApi(deckLink);

        const response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
        if (!response.ok) {
            handleDeckApiError(deckSource, response.status, response.statusText);
        }

        const data: IDeckData = await response.json();
        data.deckSource = deckSource;
        data.deckID = deckId;

        if (!fetchAll) {
            return data;
        }

        return data;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching deck:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        throw error;
    }
};

export const determineDeckSource = (deckLink: string): DeckSource => {
    if (deckLink.includes('swustats.net')) {
        return DeckSource.SWUStats;
    } else if (deckLink.includes('swudb.com')) {
        return DeckSource.SWUDB;
    } else if (deckLink.includes('swunlimiteddb.com')) {
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
    }

    // Default fallback
    return DeckSource.NotSupported;
}
