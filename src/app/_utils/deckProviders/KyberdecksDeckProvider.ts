import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class KyberdecksDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.KyberDecks;
    public readonly displayName = 'kyberdecks.com';
    public readonly hostNameMatch = 'kyberdecks.com';
    public readonly tagColor = '#9E9E9E';
    // Deck Links in the form: https://kyberdecks.com/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://exportdeck.kyberdecks.com/api/deck-export?id=${deckId}`;
    }
}
