import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './DeckProviderBase';
import { DeckFetchErrorReason } from './types';

export class SwucardhubDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUCardHub;
    public readonly displayName = 'swucardhub.fr';
    public readonly hostNameMatch = 'swucardhub.fr';
    public readonly tagColor = '#4F39F6';
    protected readonly deckIdRegex = /\/Karabast\/(\d+)\/?$/;

    protected readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure it is set to Published on swucardhub.fr.',
        },
    };

    protected buildApiUrl(deckId: string): string {
        return `https://swucardhub.fr/Karabast/${deckId}`;
    }
}
