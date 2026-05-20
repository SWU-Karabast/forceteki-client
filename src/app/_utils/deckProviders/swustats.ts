import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class SwustatsProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUStats;
    public readonly displayName = 'swustats.net';
    protected readonly hostNameMatch = 'swustats.net';

    // swustats also returns 500 for missing decks.
    protected readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the deck exists on swustats.net.',
        },
        500: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the deck exists on swustats.net.',
        },
    };

    protected parseDeckId(deckLink: string): string | null {
        const m = deckLink.match(/gameName=([^&]+)/);
        return m ? m[1] : null;
    }

    protected buildApiUrl(deckId: string): string {
        return `https://swustats.net/TCGEngine/APIs/LoadDeck.php?deckID=${deckId}&format=json&setId=true`;
    }
}
