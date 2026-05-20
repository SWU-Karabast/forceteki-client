import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class SwUnlimitedDbProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUnlimitedDB;
    public readonly displayName = 'sw-unlimited-db.com';
    protected readonly hostNameMatch = 'sw-unlimited-db.com';
    protected readonly deckIdRegex = /\/decks\/(\d+)\/?$/;

    protected readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure it is set to Published on sw-unlimited-db.',
        },
    };

    protected buildApiUrl(deckId: string): string {
        return `https://sw-unlimited-db.com/umbraco/api/deckapi/get?id=${deckId}`;
    }
}
