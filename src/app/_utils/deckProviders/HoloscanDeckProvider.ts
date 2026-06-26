import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './core/DeckProviderBase';

export class HoloscanDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.HoloScan;
    public override readonly displayName = 'holoscan.net';
    public override readonly hostNameMatch = 'holoscan.net';
    public override readonly tagColor = '#9E9E9E';
    // Deck Links in the form: https://holoscan.net/decks/${deckId}
    protected override readonly deckIdRegex = /holoscan\.net\/decks\/([^/]+)\/?$/;

    protected override buildApiUrl(deckId: string): string {
        return `https://holoscan.net/api/decks/${deckId}`;
    }
}
