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
    secondLeader?: {
        id: string;
        count: number;
    };
    base: {
        id: string;
        count: number;
    };
    deck: {
        id: string;
        count: number;
    }[];
    sideboard?: {
        id: string;
        count: number;
    }[];
    deckID?: string;
    deckSource?: string;
    isPresentInDb?: boolean;
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
 * Checks if an object only contains allowed keys (case-insensitive) and normalizes them
 * @param obj - Object to check
 * @param allowedKeys - Array of allowed key names in proper case format
 * @returns An object containing a boolean indicating if only allowed keys are present and the normalized object
 */
const hasOnlyAllowedKeys = <T extends Record<string, unknown>>(
    obj: T,
    allowedKeys: string[]
): { isValid: boolean; normalizedObj: Record<string, unknown> } => {
    const normalizedObj: Record<string, unknown> = {};
    const allowedKeysLower = allowedKeys.map(key => key.toLowerCase());

    for (const key of Object.keys(obj)) {
        const keyLower = key.toLowerCase();
        const allowedKeyIndex = allowedKeysLower.indexOf(keyLower);

        if (allowedKeyIndex === -1) {
            // Key not found in allowed keys (case-insensitive)
            return { isValid: false, normalizedObj: {} };
        }

        // Use the proper case from allowedKeys
        const normalizedKey = allowedKeys[allowedKeyIndex];
        normalizedObj[normalizedKey] = obj[key];
    }

    return { isValid: true, normalizedObj };
};

export const validateDeckJSON = (jsonString: string): DeckJSON | null => {
    // remove unnecessary whitespace
    jsonString = jsonString.replace(/\s+/g, ' ').trim();

    // Limit string length
    if (jsonString.length > MAX_JSON_SIZE) {
        return null;
    }

    // Remove unnecessary unicodes.
    // This approach only allows alphanumeric, punctuation and basic JSON structural characters
    jsonString = jsonString.replace(/[^\x20-\x7E]|[^\w\s\{\}\[\]:"',\.\-_]/g, '');

    try {
        // Try to parse as JSON with a size limit
        let deckData = JSON.parse(jsonString);

        // Verify the object only contains allowed keys at the root level and normalize it
        const rootCheck = hasOnlyAllowedKeys(deckData, ALLOWED_ROOT_KEYS);
        if (!rootCheck.isValid) {
            return null;
        }
        deckData = rootCheck.normalizedObj;

        // Validate the required fields
        if (!deckData.metadata || !deckData.leader || !deckData.base || !deckData.deck) {
            return null;
        }

        // Check if metadata contains required fields and only allowed keys
        const metadataCheck = hasOnlyAllowedKeys(deckData.metadata as Record<string, unknown>, ALLOWED_METADATA_KEYS);
        if (!metadataCheck.isValid) {
            return null;
        }
        const metadata = metadataCheck.normalizedObj;

        if (!metadata.name || typeof metadata.name !== 'string') {
            return null;
        }
        deckData.metadata = metadata as typeof deckData.metadata;

        // Validate leader and base have valid keys and ID format
        const leaderCheck = hasOnlyAllowedKeys(deckData.leader as Record<string, unknown>, ALLOWED_CARD_KEYS);
        if (!leaderCheck.isValid) {
            return null;
        }
        const leader = leaderCheck.normalizedObj;

        if (!leader.id || typeof leader.id !== 'string' ||
            typeof leader.count !== 'number' ||
            !isValidCardId(leader.id as string)) {
            return null;
        }
        deckData.leader = leader as typeof deckData.leader;

        const baseCheck = hasOnlyAllowedKeys(deckData.base as Record<string, unknown>, ALLOWED_CARD_KEYS);
        if (!baseCheck.isValid) {
            return null;
        }
        const base = baseCheck.normalizedObj;

        if (!base.id || typeof base.id !== 'string' ||
            typeof base.count !== 'number' ||
            !isValidCardId(base.id as string)) {
            return null;
        }
        deckData.base = base as typeof deckData.base;

        // Validate deck array
        if (!Array.isArray(deckData.deck) || deckData.deck.length === 0) {
            return null;
        }

        // Ensure all deck entries have id and count, and follow the format
        const normalizedDeck = [];
        for (const card of deckData.deck) {
            const cardCheck = hasOnlyAllowedKeys(card as Record<string, unknown>, ALLOWED_CARD_KEYS);
            if (!cardCheck.isValid) {
                return null;
            }
            const deckCard = cardCheck.normalizedObj;

            if (!deckCard.id || typeof deckCard.id !== 'string' ||
                deckCard.count === undefined || typeof deckCard.count !== 'number' ||
                !isValidCardId(deckCard.id as string)) {
                return null;
            }
            normalizedDeck.push(deckCard as typeof card);
        }
        deckData.deck = normalizedDeck;

        // Validate sideboard if present
        if (deckData.sideboard && Array.isArray(deckData.sideboard)) {
            const normalizedSideboard = [];
            for (const card of deckData.sideboard) {
                const cardCheck = hasOnlyAllowedKeys(card as Record<string, unknown>, ALLOWED_CARD_KEYS);
                if (!cardCheck.isValid) {
                    return null;
                }
                const sideboardCard = cardCheck.normalizedObj;

                if (!sideboardCard.id || typeof sideboardCard.id !== 'string' ||
                    sideboardCard.count === undefined || typeof sideboardCard.count !== 'number' ||
                    !isValidCardId(sideboardCard.id as string)) {
                    return null;
                }
                normalizedSideboard.push(sideboardCard as typeof card);
            }
            deckData.sideboard = normalizedSideboard;
        } else if (deckData.sideboard !== undefined && !Array.isArray(deckData.sideboard)) {
            return null;
        }

        // If we got here, the JSON structure is valid with normalized keys
        return deckData as DeckJSON;
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

    if(
        input.includes('swustats.net') ||
        input.includes('swudb.com') ||
        input.includes('sw-unlimited-db.com') ||
        input.includes('swucardhub.fr') ||
        input.includes('swubase.com') ||
        input.includes('my-swu.com')
    ) {
        return { type: 'url', data: null };
    }
    return { type: 'invalid', data:null }
};
