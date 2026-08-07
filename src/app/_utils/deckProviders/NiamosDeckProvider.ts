import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './core/DeckProviderBase';

export class NiamosDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.Niamos;
    public override readonly displayName = 'niamos.net';
    public override readonly hostNameMatch = 'niamos.net';
    public override readonly tagColor = '#9E9E9E';
    public override readonly hiddenFromPublicList = false;
    // Deck Links in the form: https://niamos.net/decks/${deckId}
    protected override readonly deckIdRegex = /niamos\.net\/decks\/([^/]+)\/?$/;

    protected override buildApiUrl(deckId: string): string {
        return `https://niamos.net/api/decks/${deckId}/json`;
    }
}
