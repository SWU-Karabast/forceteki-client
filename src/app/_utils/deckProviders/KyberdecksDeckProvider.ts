import { DeckSource } from '../deckTypes';
import { DeckProviderBase } from './core/DeckProviderBase';

export class KyberdecksDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.KyberDecks;
    public override readonly displayName = 'kyberdecks.com';
    public override readonly hostNameMatch = 'kyberdecks.com';
    public override readonly tagColor = '#9E9E9E';
    public override readonly hiddenFromPublicList = true;
    // Deck Links in the form: https://kyberdecks.com/decks/community/${deckId}
    protected override readonly deckIdRegex = /kyberdecks\.com\/decks\/(?:[^/]+\/)?([^/]+)\/?$/;

    protected override buildApiUrl(deckId: string): string {
        return `https://exportdeck.kyberdecks.com/api/deck-export?id=${deckId}`;
    }
}
