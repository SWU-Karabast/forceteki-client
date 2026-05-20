import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class HoloscanProvider extends DeckProviderBase {
    public readonly source = DeckSource.HoloScan;
    public readonly displayName = 'holoscan.net';
    protected readonly hostNameMatch = 'holoscan.net';
    // Deck Links in the form: https://holoscan.net/decks/${deckId}
    protected readonly deckIdRegex = /\/decks\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://holoscan.net/api/decks/${deckId}`;
    }
}
