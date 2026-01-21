import { ICardData, CardType } from '../../_sharedcomponents/Cards/CardTypes';

/**
 * Known token IDs - tokens can be identified by type or by these specific IDs
 * These are fallback IDs in case the type field isn't set correctly
 */
export const TOKEN_IDS = [
    '3941784506', // Battle Droid
    '3463348370', // Clone Trooper
    '7268926664', // TIE Fighter
    '9415311381', // X-Wing
];

/**
 * Represents a stack of identical tokens
 */
export interface ITokenStack {

    /** The representative card to display (first token in the stack) */
    representativeCard: ICardData;

    /** All tokens in this stack */
    tokens: ICardData[];

    /** Number of tokens in the stack */
    count: number;

    /** Whether this stack is exhausted */
    exhausted: boolean;

    /** Unique key for React rendering */
    stackKey: string;
}

/**
 * Processed units result containing both regular units and token stacks
 */
export interface IProcessedUnits {

    /** Regular units (non-tokens or tokens with modifications) */
    regularUnits: ICardData[];

    /** Stacks of identical ready tokens */
    readyTokenStacks: ITokenStack[];

    /** Stacks of identical exhausted tokens */
    exhaustedTokenStacks: ITokenStack[];
}

/**
 * Check if a card is a token unit (not token upgrades like Shield)
 * The CardType enum uses lowercase values like 'tokenUnit'
 */
export const isTokenUnit = (card: ICardData): boolean => {
    // Check the type field against CardType enum values
    const cardType = card.type;

    // Direct match against CardType.TokenUnit ('tokenUnit')
    if (cardType === CardType.TokenUnit) {
        return true;
    }

    // Check printedType as fallback
    if (card.printedType === CardType.TokenUnit) {
        return true;
    }

    // Check types array for 'token' and 'unit'
    if (card.types && card.types.length > 0) {
        const typesStr = card.types.join(' ').toLowerCase();
        if (typesStr.includes('token') && typesStr.includes('unit')) {
            return true;
        }
    }

    // Fallback to known unit token IDs (excluding Experience and Shield which are upgrades)
    // Experience ID is '8752877738', Shield ID is '2007868442'
    const unitTokenIds = ['3941784506', '3463348370', '7268926664', '9415311381'];
    if (card.id && unitTokenIds.includes(card.id)) {
        return true;
    }

    return false;
};

/**
 * Check if a token is "vanilla" (no modifications that would make it unique)
 * A vanilla token has no upgrades, no captured cards, no damage, and standard stats
 */
export const isVanillaToken = (card: ICardData): boolean => {
    // If it has upgrades attached, it's not vanilla
    if (card.subcards && card.subcards.length > 0) {
        return false;
    }

    // If it has captured cards, it's not vanilla
    if (card.capturedCards && card.capturedCards.length > 0) {
        return false;
    }

    // If it has damage, it's not vanilla (tokens with damage are visually distinct)
    if (card.damage && card.damage > 0) {
        return false;
    }

    // If it's blanked, it's unique
    if (card.isBlanked) {
        return false;
    }

    // If it has sentinel, check if all tokens of same type have sentinel
    if (card.sentinel) {
        return false;
    }

    // If it cannot be attacked (hidden), it's unique
    if (card.cannotBeAttacked) {
        return false;
    }

    return true;
};

/**
 * Generate a unique stack key for grouping identical tokens
 * Tokens are grouped by: card ID + exhausted state
 */
export const getTokenStackKey = (card: ICardData): string => {
    const exhaustedState = card.exhausted ? 'exhausted' : 'ready';
    return `token-${card.id}-${exhaustedState}`;
};

/**
 * Process units to separate regular units from stackable tokens
 * @param units Array of unit cards (with subcards and capturedCards already attached)
 * @returns Processed units with regular units and token stacks separated
 */
export const processUnitsWithTokenStacking = (units: ICardData[]): IProcessedUnits => {
    const regularUnits: ICardData[] = [];
    const tokenGroups: Map<string, ICardData[]> = new Map();

    for (const unit of units) {
        // Check if this is a stackable token unit
        if (isTokenUnit(unit) && isVanillaToken(unit)) {
            const stackKey = getTokenStackKey(unit);

            if (!tokenGroups.has(stackKey)) {
                tokenGroups.set(stackKey, []);
            }
            tokenGroups.get(stackKey)!.push(unit);
        } else {
            // Not a token unit or has modifications - treat as regular unit
            regularUnits.push(unit);
        }
    }

    // Convert token groups to stacks
    const readyTokenStacks: ITokenStack[] = [];
    const exhaustedTokenStacks: ITokenStack[] = [];

    tokenGroups.forEach((tokens, stackKey) => {
        const stack: ITokenStack = {
            representativeCard: tokens[0],
            tokens: tokens,
            count: tokens.length,
            exhausted: tokens[0].exhausted || false,
            stackKey: stackKey,
        };

        if (stack.exhausted) {
            exhaustedTokenStacks.push(stack);
        } else {
            readyTokenStacks.push(stack);
        }
    });

    // Sort stacks by card name for consistent ordering
    const sortByName = (a: ITokenStack, b: ITokenStack) =>
        (a.representativeCard.name || '').localeCompare(b.representativeCard.name || '');

    readyTokenStacks.sort(sortByName);
    exhaustedTokenStacks.sort(sortByName);

    return {
        regularUnits,
        readyTokenStacks,
        exhaustedTokenStacks,
    };
};