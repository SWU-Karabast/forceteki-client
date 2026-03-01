import { FormatLabels, SwuGameFormat } from '@/app/_constants/constants';
import {
    DecklistLocation,
    DeckValidationFailureReason,
    ICardIdAndName,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';

function locationToMessage(location: DecklistLocation): string {
    switch (location) {
        case DecklistLocation.Leader:
            return '"leader"';
        case DecklistLocation.Base:
            return '"base"';
        case DecklistLocation.Deck:
            return '"deck" or "sideboard"';
        default:
            return `<error unknown location '${location}'>`;
    }
}

export function getReadableDeckErrors(
    failures: IDeckValidationFailures,
    format: SwuGameFormat
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
        messages.push('The deck is set to private. Change the deck to unlisted or public.');
    }

    // Object-like errors (MinDecklistSizeNotMet, etc.)
    if (failures[DeckValidationFailureReason.MinDecklistSizeNotMet]) {
        const { minDecklistSize, actualDecklistSize } =
            failures[DeckValidationFailureReason.MinDecklistSizeNotMet]!;
        messages.push(
            `Minimum count for main deck + sideboard is ${minDecklistSize}, this deck only has ${actualDecklistSize} cards.`
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

    // Arrays (UnknownCardId, TooManyCopiesOfCard, IllegalInFormat, InvalidDecklistLocation)
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
                `Card "${name}" (set: ${id.toUpperCase()}) is illegal in ${FormatLabels[format]} format.`
            );
        });
    }

    const tooManyCopiesList =
        failures[DeckValidationFailureReason.TooManyCopiesOfCard] ?? [];
    if (tooManyCopiesList.length > 0) {
        tooManyCopiesList.forEach(({ card, maxCopies, actualCopies }) => {
            messages.push(
                `Card "${card.name}" (id: ${card.id.toUpperCase()}) exceeds the maximum copies allowed (${maxCopies}). The deck contains ${actualCopies}.`
            );
        });
    }

    const invalidDecklistLocationList =
        failures[DeckValidationFailureReason.InvalidDecklistLocation] ?? [];
    if (invalidDecklistLocationList.length > 0) {
        invalidDecklistLocationList.forEach(({ card, location }) => {
            messages.push(
                `Card "${card.name}" (id: ${card.id.toUpperCase()}) is not legal in the ${locationToMessage(location)} part of the decklist.`
            );
        });
    }

    return messages;
}