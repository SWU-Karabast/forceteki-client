import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class SwubaseDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUBase;
    public override readonly displayName = 'swubase.com';
    public override readonly hostNameMatch = 'swubase.com';
    public override readonly tagColor = '#4CFF85';
    // Deck Links in the form: https://swubase.com/decks/${deckId}
    protected override readonly deckIdRegex = /swubase\.com\/decks\/([^/]+)\/?$/;

    // SWUBase returns 404 for private decks.
    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.Private,
            message: 'Deck not found. Make sure the deck is set to Public on swubase.com.',
        },
    };

    protected override buildApiUrl(deckId: string): string {
        return `https://swubase.com/api/deck/${deckId}/json`;
    }
}
