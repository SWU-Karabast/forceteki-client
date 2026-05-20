import { IDeckData } from '../deckTypes';
import { CardcoreProvider } from './cardcore';
import { HoloscanProvider } from './holoscan';
import { KyberdecksProvider } from './kyberdecks';
import { MySwuProvider } from './mySwu';
import { ProtectThePodProvider } from './protectThePod';
import { SwubaseProvider } from './swubase';
import { SwucardhubProvider } from './swucardhub';
import { SwuforgeProvider } from './swuforge';
import { SwumetastatsProvider } from './swumetastats';
import { SwUnlimitedDbProvider } from './swUnlimitedDb';
import { SwustatsProvider } from './swustats';
import { DeckFetchError, DeckFetchErrorReason, IDeckProvider } from './types';

/**
 * Ordered list of deck-builder providers consulted by
 * {@link fetchExternalDeckListAsync}. The first provider whose `matches`
 * returns true wins. Note: SWUDB is intentionally NOT in this list — its
 * resolution still happens on the BE via `/api/resolve-deck-link`.
 */
const providers: IDeckProvider[] = [
    new SwustatsProvider(),
    new SwUnlimitedDbProvider(),
    new SwucardhubProvider(),
    new SwubaseProvider(),
    new SwumetastatsProvider(),
    new MySwuProvider(),
    new ProtectThePodProvider(),
    new SwuforgeProvider(),
    new KyberdecksProvider(),
    new CardcoreProvider(),
    new HoloscanProvider(),
];

/**
 * Resolve a deck link from any non-SWUDB provider directly from the browser.
 * Throws {@link DeckFetchError} (never a plain `Error`) so callers can switch
 * on `error.reason` for UX.
 */
export async function fetchExternalDeckListAsync(deckLink: string): Promise<IDeckData> {
    const provider = providers.find((p) => p.matches(deckLink));
    if (!provider) {
        throw new DeckFetchError(
            DeckFetchErrorReason.UnsupportedProvider,
            'Unsupported deck link domain',
        );
    }
    const data = await provider.fetchAsync(deckLink);
    data.deckLink = deckLink;
    return data;
}
