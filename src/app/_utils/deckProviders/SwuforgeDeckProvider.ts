import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class SwuforgeDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUForge;
    public readonly displayName = 'swuforge.com';
    public readonly hostNameMatch = 'swuforge.com';
    public readonly tagColor = '#9E9E9E';
    // Deck Links in the form: https://swuforge.com/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://swuforge.com/api/decks/${deckId}/json`;
    }
}
