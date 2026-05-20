import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class CardcoreDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.CardCore;
    public readonly displayName = 'cardcore.gg';
    public readonly hostNameMatch = 'cardcore.gg';
    public readonly tagColor = '#FF6B35';
    // Deck Links in the form: https://store.cardcore.gg/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/(\d+)\/?$/;

    protected readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the deck is set to Public on cardcore.gg.',
        },
    };

    protected buildApiUrl(deckId: string): string {
        return `https://store.cardcore.gg/api/decks/${deckId}/json`;
    }
}
