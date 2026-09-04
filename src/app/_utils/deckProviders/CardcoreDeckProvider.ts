import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class CardcoreDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.CardCore;
    public override readonly displayName = 'cardcore.gg';
    public override readonly hostNameMatch = 'cardcore.gg';
    public override readonly tagColor = '#FF6B35';
    public override readonly hiddenFromPublicList = false;
    // Deck Links in the form: https://store.cardcore.gg/swu/decks/${deckId}
    protected override readonly deckIdRegex = /cardcore\.gg\/(?:[^/]+\/)?decks\/(\d+)\/?$/;

    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the deck is set to Public on cardcore.gg.',
        },
    };

    protected override buildApiUrl(deckId: string): string {
        return `https://store.cardcore.gg/api/decks/${deckId}/json`;
    }
}
