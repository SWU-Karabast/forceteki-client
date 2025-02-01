// app/_utils/fetchDeckData.ts

import { updateIdsWithMapping, mapIdToInternalName, transformDeckWithCardData } from '@/app/_utils/s3Utils';

export interface IDeckMetadata {
    name: string;
    author: string;
}

export interface IDeckCard {
    id: string;
    count: number;
}

export enum DeckSource {
    Undefined = 0,
    SWUStats = 1,
    SWUDB = 2
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

export const fetchDeckData = async (deckLink: string) => {
    try {
        const response = await fetch(
            `/api/swudbdeck?deckLink=${encodeURIComponent(deckLink)}`
        );
        if (!response.ok) {
            throw new Error(`Failed to fetch deck: ${response.statusText}`);
        }

        const data: IDeckData = await response.json();

        // Fetch setToId mapping
        const setCodeMapping = await fetch('/api/s3bucket?jsonFile=_setCodeMap.json');
        if (!setCodeMapping.ok) {
            throw new Error('Failed to fetch card mapping');
        }
        const jsonData = await setCodeMapping.json();
        const deckWithIds = updateIdsWithMapping(data, jsonData);

        // Fetch codeToInternalname mapping
        const codeInternalnameMapping = await fetch('/api/s3bucket?jsonFile=_cardMap.json');
        if (!codeInternalnameMapping.ok) {
            throw new Error('Failed to fetch card mapping');
        }
        const codeInternalnameJson = await codeInternalnameMapping.json();
        const deckWithInternalNames = mapIdToInternalName(codeInternalnameJson, deckWithIds);

        // Transform deck with final card data
        const finalDeckForm = await transformDeckWithCardData(deckWithInternalNames);
        return finalDeckForm;
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error fetching deck:', error.message);
        } else {
            console.error('Unexpected error:', error);
        }
        return null; // or throw error again
    }
};