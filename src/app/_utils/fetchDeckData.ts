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
    SWUnlimitedDB = 'SWUnlimitedDB'
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
}

export const fetchDeckData = async (deckLink: string, fetchAll: boolean = true) => {
    try {
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

        const data: IDeckData = await response.json();
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
