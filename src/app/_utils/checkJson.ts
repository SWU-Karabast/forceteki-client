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

const ALLOWED_ROOT_KEYS = ['metadata', 'leader', 'base', 'deck', 'sideboard', 'deckID', 'deckSource'];
const ALLOWED_METADATA_KEYS = ['name', 'author'];
const ALLOWED_CARD_KEYS = ['id', 'count'];
const CARD_ID_REGEX = /^[A-Z]{3}_\d{3}$/;
const MAX_JSON_SIZE = 2000;

/**
 * Validates if a card ID follows the expected format (CCC_###)
 * @param id - Card ID to validate
 * @returns boolean indicating if the ID is valid
 */
const isValidCardId = (id: string): boolean => {
    return CARD_ID_REGEX.test(id);
};


/**
 * Checks if an object only contains allowed keys
 * @param obj - Object to check
 * @param allowedKeys - Array of allowed key names
 * @returns boolean indicating if only allowed keys are present
 */
const hasOnlyAllowedKeys = (obj: Record<string, unknown>, allowedKeys: string[]): boolean => {
    for (const key of Object.keys(obj)) {
        if (!allowedKeys.includes(key)) {
            return false;
        }
    }
    return true;
};

/**
 * Sanitizes a string before JSON parsing to prevent security issues
 * @param jsonString - String to sanitize
 * @returns Sanitized string
 */
const sanitizeJsonString = (jsonString: string): string => {
    // remove unnecesary whitespace
    jsonString = jsonString.replace(/\s+/g, ' ').trim();

    // Limit string length
    if (jsonString.length > MAX_JSON_SIZE) {
        jsonString = jsonString.substring(0, MAX_JSON_SIZE);
    }

    // Remove unnecessary unicodes.
    // This approach only allows alphanumeric, punctuation and basic JSON structural characters
    return jsonString.replace(/[^\x20-\x7E]|[^\w\s\{\}\[\]:"',\.\-_]/g, '');
};

/**
 * Validates if a string is a properly formatted deck JSON
 * @param jsonString - String to validate as JSON
 * @returns Parsed DeckJSON object if valid, null if invalid
 */
export const validateDeckJSON = (jsonString: string): DeckJSON | null => {
    const sanitizedJson = sanitizeJsonString(jsonString);

    try {
        // Try to parse as JSON with a size limit
        const deckData = JSON.parse(sanitizedJson);

        // Verify the object only contains allowed keys at the root level
        if (!hasOnlyAllowedKeys(deckData, ALLOWED_ROOT_KEYS)) {
            return null;
        }

        // Validate the required fields
        if (!deckData.metadata || !deckData.leader || !deckData.base || !deckData.deck) {
            return null;
        }

        // Check if metadata contains required fields and only allowed keys
        const metadata = deckData.metadata as Record<string, unknown>;
        if (!metadata.name || typeof metadata.name !== 'string' ||
            !hasOnlyAllowedKeys(metadata, ALLOWED_METADATA_KEYS)) {
            return null;
        }

        // Validate leader and base have valid keys and ID format
        const leader = deckData.leader as Record<string, unknown>;
        if (!leader.id || typeof leader.id !== 'string' ||
            typeof leader.count !== 'number' ||
            !hasOnlyAllowedKeys(leader, ALLOWED_CARD_KEYS) ||
            !isValidCardId(leader.id)) {
            return null;
        }

        const base = deckData.base as Record<string, unknown>;
        if (!base.id || typeof base.id !== 'string' ||
            typeof base.count !== 'number' ||
            !hasOnlyAllowedKeys(base, ALLOWED_CARD_KEYS) ||
            !isValidCardId(base.id)) {
            return null;
        }

        // Validate deck array
        if (!Array.isArray(deckData.deck) || deckData.deck.length === 0) {
            return null;
        }

        // Ensure all deck entries have id and count, and follow the format
        for (const card of deckData.deck) {
            const deckCard = card as Record<string, unknown>;
            if (!deckCard.id || typeof deckCard.id !== 'string' ||
                deckCard.count === undefined || typeof deckCard.count !== 'number' ||
                !hasOnlyAllowedKeys(deckCard, ALLOWED_CARD_KEYS) ||
                !isValidCardId(deckCard.id)) {
                return null;
            }
        }


        // Validate sideboard if present
        if (deckData.sideboard && Array.isArray(deckData.sideboard)) {
            for (const card of deckData.sideboard) {
                const sideboardCard = card as Record<string, unknown>;
                if (!sideboardCard.id || typeof sideboardCard.id !== 'string' ||
                    sideboardCard.count === undefined || typeof sideboardCard.count !== 'number' ||
                    !hasOnlyAllowedKeys(sideboardCard, ALLOWED_CARD_KEYS) ||
                    !isValidCardId(sideboardCard.id)) {
                    return null;
                }
            }
        }else if(!Array.isArray(deckData.sideboard)) {
            return null
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