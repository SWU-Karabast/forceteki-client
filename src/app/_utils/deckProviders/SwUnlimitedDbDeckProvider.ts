import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class SwUnlimitedDbDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUnlimitedDB;
    public override readonly displayName = 'sw-unlimited-db.com';
    public override readonly hostNameMatch = 'sw-unlimited-db.com';
    public override readonly tagColor = '#4CFF85';
    // Deck Links in the form: https://sw-unlimited-db.com/decks/${deckId}
    protected override readonly deckIdRegex = /sw-unlimited-db\.com\/decks\/(\d+)\/?$/;

    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure it is set to Published on sw-unlimited-db.',
        },
    };

    protected override buildApiUrl(deckId: string): string {
        return `https://sw-unlimited-db.com/umbraco/api/deckapi/get?id=${deckId}`;
    }
}
