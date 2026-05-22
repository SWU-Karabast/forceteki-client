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
    SWUForge = 'SWUForge',
    KyberDecks = 'KyberDecks',
    CardCore = 'CardCore',
    HoloScan = 'HoloScan',
    JSON = 'JSON'
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

export const fetchDeckData = async (deckLink: string, fetchAll: boolean = true) => {
    try {
        const source = determineDeckSource(deckLink);
        let data: IDeckData;

        if (source === DeckSource.SWUDB) {
            // swudb.com deck resolution lives on the BE; the Amplify
            // `/api/swudbdeck` route still handles other deck-builders.
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_ROOT_URL}/api/resolve-deck-link`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deckLink }),
                    credentials: 'include'
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const message = errorData?.error ?? `Failed to fetch deck: ${response.status}`;
                if (response.status === 403) {
                    throw new Error(`403: ${message}`);
                }
                throw new Error(message);
            }
            const body = await response.json();
            data = {
                ...(body.deck as IDeckData),
                deckSource: DeckSource.SWUDB,
            };
        } else {
            const response = await fetch(
                `/api/swudbdeck?deckLink=${encodeURIComponent(deckLink)}`
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                if (errorData && errorData.error) {
                    if (response.status === 403) {
                        throw new Error(`403: ${errorData.error}`);
                    } else {
                        throw new Error(errorData.error);
                    }
                } else {
                    throw new Error(`Failed to fetch deck: ${response.status}`);
                }
            }
            data = await response.json();
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
