import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class SwuforgeProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUForge;
    public readonly displayName = 'swuforge.com';
    protected readonly hostNameMatch = 'swuforge.com';
    // Deck Links in the form: https://swuforge.com/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://swuforge.com/api/decks/${deckId}/json`;
    }
}
