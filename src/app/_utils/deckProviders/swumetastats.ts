import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';

export class SwumetastatsProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUMetaStats;
    public readonly displayName = 'swumetastats.com';
    protected readonly hostNameMatch = 'swumetastats.com';
    protected readonly deckIdRegex = /\/decklists\/([^/]+)\/?$/;

    protected buildApiUrl(deckId: string): string {
        return `https://www.swumetastats.com/api/decklists/${deckId}/json`;
    }
}
