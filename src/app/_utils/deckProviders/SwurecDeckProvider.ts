import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchError, DeckFetchErrorReason } from './core/types';

export class SwurecDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWURec;
    public override readonly displayName = 'swurec.gg';
    public override readonly hostNameMatch = 'swurec.gg';
    public override readonly tagColor = '#E5A823';
    public override readonly hiddenFromPublicList = false;

    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Its share link may have been rotated on swurec.gg.',
        },
    };

    // swurec.gg deck links: https://swurec.gg/decks/{deckId}?key={shareToken}
    // The share token addresses the deck directly, so it is what we extract.
    protected override parseDeckId(deckLink: string): string | null {
        try {
            // Parse-then-discard purely to validate it's a real URL; the
            // host-aware regex below is what actually extracts the share token.
            new URL(deckLink);
        } catch {
            throw new DeckFetchError(
                DeckFetchErrorReason.InvalidLink,
                'Invalid deckLink format. Share a deck link from swurec.gg.',
                undefined,
                this.displayName,
            );
        }
        const m = deckLink.match(/swurec\.gg\/decks\/\d+[?&]key=([a-zA-Z0-9_-]+)/);
        if (!m || !m[1]) {
            throw new DeckFetchError(
                DeckFetchErrorReason.InvalidLink,
                'Invalid deckLink format. Share a deck link from swurec.gg.',
                undefined,
                this.displayName,
            );
        }
        return m[1];
    }

    protected override buildApiUrl(shareToken: string): string {
        return `https://swurec.gg/api/decks/karabast-export/${encodeURIComponent(shareToken)}`;
    }
}
