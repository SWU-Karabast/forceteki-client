import { DeckSource } from '../deckTypes';
import { DeckProviderBase, IStatusErrorOverride } from './core/DeckProviderBase';
import { DeckFetchErrorReason } from './core/types';

export class SwupediaDeckProvider extends DeckProviderBase {
    public override readonly source = DeckSource.SWUPedia;
    public override readonly displayName = 'swupedia.com';
    public override readonly hostNameMatch = 'swupedia.com';
    public override readonly tagColor = '#615FFF';
    public override readonly hiddenFromPublicList = false;
    protected override readonly deckIdRegex = /\/deck\/([2-9A-HJ-NP-Za-km-z]{12})(?=\/|\?|#|$)/;

    protected override readonly statusErrorOverrides: Partial<Record<number, IStatusErrorOverride>> = {
        404: {
            reason: DeckFetchErrorReason.NotFound,
            message: 'Deck not found. Make sure it is set to Unlisted (and NOT Private) on SWUPedia.com',
        },
        422: {
            reason: DeckFetchErrorReason.ProviderError,
            message: 'SWUPedia could not return a valid Karabast deck. Please check if your deck contains valid entries.'
        }
    };

    protected override buildApiUrl(deckId: string): string {
        return `https://swupedia.com/deck/${deckId}/karabast`;
    }
}
