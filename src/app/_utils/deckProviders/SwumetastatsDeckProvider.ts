import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class SwumetastatsDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUMetaStats;
    public readonly displayName = 'swumetastats.com';
    public readonly hostNameMatch = 'swumetastats.com';
    public readonly tagColor = '#00DBCC';
    protected readonly deckIdRegex = /\/decklists\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://www.swumetastats.com/api/decklists/${deckId}/json`;
    }
}
