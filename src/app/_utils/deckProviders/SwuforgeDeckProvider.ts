import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class SwuforgeDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUForge;
    public override readonly displayName = 'swuforge.com';
    public override readonly hostNameMatch = 'swuforge.com';
    public override readonly tagColor = '#9E9E9E';
    // Deck Links in the form: https://swuforge.com/decks/${deckId}
    protected override readonly deckIdRegex = /swuforge\.com\/decks\/([^/]+)\/?$/;

    protected override buildApiUrl(deckId: string): string {
        return `https://swuforge.com/api/decks/${deckId}/json`;
    }
}
