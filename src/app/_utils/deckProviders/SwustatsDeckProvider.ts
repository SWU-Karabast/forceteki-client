import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class SwustatsDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUStats;
    public override readonly displayName = 'swustats.net';
    public override readonly hostNameMatch = 'swustats.net';
    public override readonly tagColor = '#FFD700';

    // swustats also returns 500 for missing decks.
    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the deck exists on swustats.net.',
        },
        500: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the deck exists on swustats.net.',
        },
    };

    // Deck Links in the form: https://swustats.net/...?gameName=${deckId}
    protected override parseDeckId(deckLink: string): string | null {
        const m = deckLink.match(/swustats\.net\/.*[?&]gameName=([^&]+)/);
        return m ? m[1] : null;
    }

    protected override buildApiUrl(deckId: string): string {
        return `https://swustats.net/TCGEngine/APIs/LoadDeck.php?deckID=${deckId}&format=json&setId=true`;
    }
}
