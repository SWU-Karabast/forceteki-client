import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class SithvaultDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SithVault;
    public override readonly displayName = 'sithvault.com';
    public override readonly hostNameMatch = 'sithvault.com';
    public override readonly tagColor = '#E7000B';
    public override readonly hiddenFromPublicList = false;
    // Deck Links in the form: https://www.sithvault.com/decks/${deckId}
    // Anchored on the uuid shape because SithVault also serves /decks/build,
    // /decks/draft and /decks/trilogy/${id}; a looser capture matches those
    // too and sends a meaningless id to the API.
    protected override readonly deckIdRegex =
        /sithvault\.com\/decks\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?=[/?#]|$)/;

    // SithVault serves unlisted decks by link, so a 404 really does mean the
    // deck is not saved to an account — there is no "make it public" step.
    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure the deck is saved to your account on sithvault.com.',
        },
        422: {
            reason: DeckFetchErrorReason.ProviderError,
            message: 'SithVault could not return a valid Karabast deck. Check that the deck has a leader and a base.',
        },
    };

    // Hit the canonical `www.` host directly. The apex `sithvault.com`
    // 307-redirects to `www.`, and browsers cannot follow cross-origin CORS
    // redirects.
    protected override buildApiUrl(deckId: string): string {
        return `https://www.sithvault.com/decks/${deckId}/karabast`;
    }
}
