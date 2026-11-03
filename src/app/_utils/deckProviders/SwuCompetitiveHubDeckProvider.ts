import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class SwuCompetitiveHubDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUCompetitiveHub;
    public override readonly displayName = 'swu-competitivehub.com';
    public override readonly hostNameMatch = 'swu-competitivehub.com';
    public override readonly tagColor = '#FFD369';
    public override readonly hiddenFromPublicList = false;
    // Tournament decklists are public: a 404 means the decklist has no full card list
    // (only a Melee link or a picture) or does not exist.
    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the decklist shows its full card list on swu-competitivehub.com.',
        },
        422: {
            reason: DeckFetchErrorReason.ProviderError,
            message: 'SWU Competitive Hub could not return a valid Karabast deck: the decklist has no leader or base.',
        },
    };

    // Deck links in two forms, both anchored on the numeric id so /decklists/ (the list page) never matches:
    // - the deck page: https://www.swu-competitivehub.com/decklist/${deckId}/
    // - an event page with the deck drawer open: https://www.swu-competitivehub.com/event/${eventSlug}/?deck=${deckId}
    protected override parseDeckId(deckLink: string): string | null {
        const m = deckLink.match(/swu-competitivehub\.com\/decklist\/(\d+)(?=[/?#]|$)/)
            ?? deckLink.match(/swu-competitivehub\.com\/event\/[^?#]*\?(?:[^#]*&)?deck=(\d+)(?=[&#]|$)/);
        return m ? m[1] : null;
    }

    // Hit the canonical `www.` host directly. The apex `swu-competitivehub.com`
    // 301-redirects to `www.`, and browsers cannot follow cross-origin CORS
    // redirects.
    protected override buildApiUrl(deckId: string): string {
        return `https://www.swu-competitivehub.com/decklist/${deckId}/karabast.json`;
    }
}
