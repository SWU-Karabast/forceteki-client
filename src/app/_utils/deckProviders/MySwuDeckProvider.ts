import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class MySwuDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.MySWU;
    public readonly displayName = 'my-swu.com';
    public readonly hostNameMatch = 'my-swu.com';
    public readonly tagColor = '#F65526';

    // My-SWU returns 404 for private decks.
    protected readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.Private,
            message: 'Deck not found. Make sure the deck is set to Public or Unlisted on my-swu.com.',
        },
    };

    // Deck Links in the forms:
    //   https://my-swu.com/decks/${deckId}
    //   https://my-swu.com/decks/me/${deckId}
    //   https://my-swu.com/decks/explore/${category}/${deckId}
    protected parseDeckId(deckLink: string): string | null {
        const withoutQuery = deckLink.split('?')[0];
        const m = withoutQuery.match(/\/decks\/(?:me\/|explore\/[^/]+\/)?([^/]+)\/?$/);
        return m ? m[1] : null;
    }

    protected buildApiUrl(deckId: string): string {
        return `https://my-swu.com/api/decks/${deckId}/json`;
    }
}
