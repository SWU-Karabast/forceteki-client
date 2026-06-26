import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class SwucardhubDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUCardHub;
    public override readonly displayName = 'swucardhub.fr';
    public override readonly hostNameMatch = 'swucardhub.fr';
    public override readonly tagColor = '#4F39F6';
    // Deck Links in the form: https://swucardhub.fr/Karabast/${deckId}
    protected override readonly deckIdRegex = /swucardhub\.fr\/Karabast\/(\d+)\/?$/;

    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure it is set to Published on swucardhub.fr.',
        },
    };

    protected override buildApiUrl(deckId: string): string {
        return `https://swucardhub.fr/Karabast/${deckId}`;
    }
}
