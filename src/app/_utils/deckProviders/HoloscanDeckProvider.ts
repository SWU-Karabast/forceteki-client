import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class HoloscanDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.HoloScan;
    public readonly displayName = 'holoscan.net';
    public readonly hostNameMatch = 'holoscan.net';
    public readonly tagColor = '#9E9E9E';
    // Deck Links in the form: https://holoscan.net/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://holoscan.net/api/decks/${deckId}`;
    }
}
