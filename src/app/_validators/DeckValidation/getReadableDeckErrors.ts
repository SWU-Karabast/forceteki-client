import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';


export function getReadableDeckErrors(
    failures: IDeckValidationFailures,
    format: string
): string[] {
    const messages: string[] = [];

    // Simple booleans (e.g., InvalidDeckData, TooManyLeaders)
    if (failures[DeckValidationFailureReason.InvalidDeckData]) {
        messages.push('Deck is invalid or missing required fields.');
    }
    if (failures[DeckValidationFailureReason.TooManyLeaders]) {
        messages.push(`There are too many Leaders for ${format}.`);
    }
    if(failures[DeckValidationFailureReason.DeckSetToPrivate]) {
        messages.push('The deck is set to private. Change the deck to unlisted.')
    }

    // Object-like errors (MinDecklistSizeNotMet, etc.)
    if (failures[DeckValidationFailureReason.MinDecklistSizeNotMet]) {
        const { minDecklistSize, actualDecklistSize } =
            failures[DeckValidationFailureReason.MinDecklistSizeNotMet]!;
        messages.push(
            `Minimum deck size is ${minDecklistSize}, this deck only has ${actualDecklistSize} cards.`
        );
    }

    if (failures[DeckValidationFailureReason.MinMainboardSizeNotMet]) {
        const { minBoardedSize, actualBoardedSize } =
            failures[DeckValidationFailureReason.MinMainboardSizeNotMet]!;
        messages.push(
            `Your main deck must have at least ${minBoardedSize} cards, but currently has ${actualBoardedSize}.`
        );
    }

    if (failures[DeckValidationFailureReason.MaxSideboardSizeExceeded]) {
        const { maxSideboardSize, actualSideboardSize } =
            failures[DeckValidationFailureReason.MaxSideboardSizeExceeded]!;
        messages.push(
            `Sideboard can have at most ${maxSideboardSize} cards, but the current sideboard has ${actualSideboardSize}.`
        );
    }

    // Arrays (UnknownCardId, TooManyCopiesOfCard, IllegalInFormat)
    const unknownIdList = failures[DeckValidationFailureReason.UnknownCardId] ?? [];
    if (unknownIdList.length > 0) {
        unknownIdList.forEach(({ id }) => {
            messages.push(`Card with ID "${id}" is unknown or doesn't exist yet is contained in the deck.`);
        });
    }

    const illegalInFormatList =
        failures[DeckValidationFailureReason.IllegalInFormat] ?? [];
    if (illegalInFormatList.length > 0) {
        illegalInFormatList.forEach(({ name, id }) => {
            messages.push(
                `Card "${name}" (set: ${id.toUpperCase()}) is illegal in ${format} format.`
            );
        });
    }

    const tooManyCopiesList =
        failures[DeckValidationFailureReason.TooManyCopiesOfCard] ?? [];
    if (tooManyCopiesList.length > 0) {
        tooManyCopiesList.forEach(({ card, maxCopies, actualCopies }) => {
            messages.push(
                `Card "${card.name}" (id: ${card.id}) exceeds the maximum copies allowed (${maxCopies}). The deck contains ${actualCopies}.`
            );
        });
    }

    return messages;
}