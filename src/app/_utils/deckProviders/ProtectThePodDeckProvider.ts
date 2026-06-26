import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchError, DeckFetchErrorReason } from './types';

export class ProtectThePodDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.ProtectThePod;
    public override readonly displayName = 'protectthepod.com';
    public override readonly hostNameMatch = 'protectthepod.com';
    public override readonly tagColor = '#B388FF';

    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        400: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'No deck has been built for this pool yet. Build a deck on protectthepod.com first, then share the link.',
        },
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Pool not found on protectthepod.com.',
        },
    };

    // Protect the Pod deck links: https://protectthepod.com/pool/{shareId}/deck/play
    protected override parseDeckId(deckLink: string): string | null {
        try {
            // Parse-then-discard purely to validate it's a real URL; the
            // host-aware regex below is what actually extracts the share id.
            new URL(deckLink);
        } catch {
            throw new DeckFetchError(
                DeckFetchErrorReason.InvalidLink,
                'Invalid deckLink format. Share a pool or deck builder link from protectthepod.com.',
                undefined,
                this.displayName,
            );
        }
        const m = deckLink.match(/protectthepod\.com\/pool\/([a-zA-Z0-9_-]+)/);
        if (!m || !m[1]) {
            throw new DeckFetchError(
                DeckFetchErrorReason.InvalidLink,
                'Invalid deckLink format. Share a pool or deck builder link from protectthepod.com.',
                undefined,
                this.displayName,
            );
        }
        return m[1];
    }

    // Hit the canonical `www.` host directly. The apex `protectthepod.com`
    // 301-redirects to `www.`, and browsers cannot follow cross-origin CORS
    // redirects.
    protected override buildApiUrl(shareId: string): string {
        return `https://www.protectthepod.com/api/pools/${encodeURIComponent(shareId)}/deck.json`;
    }
}
