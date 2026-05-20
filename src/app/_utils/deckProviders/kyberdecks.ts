import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class KyberdecksProvider extends DeckProviderBase {
    public readonly source = DeckSource.KyberDecks;
    public readonly displayName = 'kyberdecks.com';
    protected readonly hostNameMatch = 'kyberdecks.com';
    // Deck Links in the form: https://kyberdecks.com/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://exportdeck.kyberdecks.com/api/deck-export?id=${deckId}`;
    }
}
