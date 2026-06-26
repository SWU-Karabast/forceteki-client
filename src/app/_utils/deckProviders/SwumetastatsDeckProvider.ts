import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './core/DeckProviderBase';

export class SwumetastatsDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUMetaStats;
    public override readonly displayName = 'swumetastats.com';
    public override readonly hostNameMatch = 'swumetastats.com';
    public override readonly tagColor = '#00DBCC';
    // Deck Links in the form: https://www.swumetastats.com/decklists/${deckId}
    // (may carry a ?format=…&meta=… query string, which must not be captured).
    protected override readonly deckIdRegex = /swumetastats\.com\/decklists\/([^/?#]+)/;

    protected override buildApiUrl(deckId: string): string {
        return `https://www.swumetastats.com/api/decklists/${deckId}/json`;
    }
}
