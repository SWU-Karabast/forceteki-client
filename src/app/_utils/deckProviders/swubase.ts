import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class SwubaseProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUBase;
    public readonly displayName = 'swubase.com';
    protected readonly hostNameMatch = 'swubase.com';
    // Deck Links in the form: https://swubase.com/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/([^/]+)\/?$/;

    // SWUBase returns 404 for private decks.
    protected readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.Private,
            message: 'Deck not found. Make sure the deck is set to Public on swubase.com.',
        },
    };

    protected buildApiUrl(deckId: string): string {
        return `https://swubase.com/api/deck/${deckId}/json`;
    }
}
