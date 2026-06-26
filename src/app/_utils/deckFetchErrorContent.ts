import { DeckFetchError, DeckFetchErrorReason } from '@/app/_utils/fetchDeckData';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { DiscordInviteUrl } from '@/app/_constants/constants';
import { IErrorFooterLink } from '@/app/_hooks/useDeckErrors';

export interface IDeckFetchErrorContent {
    summary: string;
    details?: IDeckValidationFailures | string;
    title: string;
    modalType: 'error' | 'warning';
    footerLink?: IErrorFooterLink;
}

/**
 * Maps a DeckFetchError to the user-facing error content (summary, details, title,
 * modal type, and optional footer link) shown in the various deck-import error modals.
 * Single source of truth for these messages across all deck-import entry points.
 */
export function getDeckFetchErrorContent(error: DeckFetchError): IDeckFetchErrorContent {
    switch (error.reason) {
        case DeckFetchErrorReason.Private:
            return {
                summary: 'Couldn\'t import. The deck is set to private.',
                details: { [DeckValidationFailureReason.DeckSetToPrivate]: true },
                title: 'Deck Validation Error',
                modalType: 'error',
            };
        case DeckFetchErrorReason.NotFound:
            return {
                summary: error.message,
                details: error.message,
                title: 'Deck Not Found',
                modalType: 'error',
            };
        case DeckFetchErrorReason.InvalidLink:
        case DeckFetchErrorReason.UnsupportedProvider:
            return {
                summary: 'Couldn\'t import. Deck link is invalid or unsupported.',
                title: 'Deck Validation Error',
                modalType: 'error',
            };
        case DeckFetchErrorReason.NetworkError:
        case DeckFetchErrorReason.ProviderError: {
            const partnerMsg = `${error.providerName ?? 'The deck site'} failed to return a decklist. Try again later.`;
            return {
                summary: partnerMsg,
                details: partnerMsg,
                title: 'Deck Validation Error',
                modalType: 'error',
                footerLink: { label: 'Report this issue in our Discord', href: DiscordInviteUrl },
            };
        }
        default:
            return {
                summary: 'Couldn\'t import. Deck is invalid.',
                title: 'Deck Validation Error',
                modalType: 'error',
            };
    }
}
