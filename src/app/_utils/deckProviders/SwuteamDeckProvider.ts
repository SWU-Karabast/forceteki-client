import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class SwuteamDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUTeam;
    public override readonly displayName = 'swuteam.link';
    public override readonly hostNameMatch = 'swuteam.link';
    public override readonly tagColor = '#F0B92E';
    public override readonly hiddenFromPublicList = false;
    // Deck links in the form: https://www.swuteam.link/decklists/${deckId} (the id is a uuid)
    protected override readonly deckIdRegex = /swuteam\.link\/decklists\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/?$/i;

    // SWU Team returns 404 for a private deck whose owner hasn't turned on its Karabast link.
    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.Private,
            message: 'Deck not found. Make sure the deck is public, or that its Karabast link is turned on, on swuteam.link.',
        },
    };

    protected override buildApiUrl(deckId: string): string {
        return `https://www.swuteam.link/api/decks/${deckId}/karabast`;
    }
}
