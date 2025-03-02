// src/app/_utils/deckValidationUtils.ts

/**
 * Interface for deck JSON structure
 */
export interface DeckJSON {
    metadata: {
        name: string;
        author?: string;
    };
    leader: {
        id: string;
        count: number;
    };
    base: {
        id: string;
        count: number;
    };
    deck: Array<{
        id: string;
        count: number;
    }>;
    sideboard?: Array<{
        id: string;
        count: number;
    }>;
    deckID?: string;
    deckSource?: string;
}

/**
 * Validates if a string is a properly formatted deck JSON
 * @param jsonString - String to validate as JSON
 * @returns Parsed DeckJSON object if valid, null if invalid
 */
export const validateDeckJSON = (jsonString: string): DeckJSON | null => {
    try {
        // Try to parse as JSON
        const deckData = JSON.parse(jsonString);

        // Validate the required fields
        if (!deckData.metadata || !deckData.leader || !deckData.base || !deckData.deck) {
            return null;
        }

        // Check if metadata contains required fields
        if (!deckData.metadata.name) {
            return null;
        }

        // Validate leader and base
        if (!deckData.leader.id || !deckData.base.id) {
            return null;
        }

        // Validate deck array
        if (!Array.isArray(deckData.deck) || deckData.deck.length === 0) {
            return null;
        }

        // Ensure all deck entries have id and count
        for (const card of deckData.deck) {
            if (!card.id || card.count === undefined) {
                return null;
            }
        }

        // Validate sideboard if present
        if (deckData.sideboard && Array.isArray(deckData.sideboard)) {
            for (const card of deckData.sideboard) {
                if (!card.id || card.count === undefined) {
                    return null;
                }
            }
        }

        // If we got here, the JSON structure is valid
        return deckData;
    } catch (error) {
        // JSON parsing failed
        return null;
    }
};

/**
 * Attempts to parse input as either a deck URL or deck JSON
 * @param input - String containing either a URL or JSON
 * @returns Object with the input type and the parsed deck if valid
 */
export const parseInputAsDeckData = (input: string): {
    type: 'url' | 'json' | 'invalid',
    data: DeckJSON | null
} => {
    const jsonData = validateDeckJSON(input);
    if (jsonData) {
        return { type: 'json', data: jsonData };
    }

    if(input.includes('swustats.net') || input.includes('swudb.com')){
        return { type: 'url', data: null };
    }
    return { type: 'invalid', data:null }
};