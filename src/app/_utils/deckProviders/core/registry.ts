import type { SxProps, Theme } from '@mui/material';
import { DeckSource, IDeckData } from '../../deckTypes';
import { CardcoreDeckProvider } from '../CardcoreDeckProvider';
import { DeckProviderBase } from './DeckProviderBase';
import { HoloscanDeckProvider } from '../HoloscanDeckProvider';
import { KyberdecksDeckProvider } from '../KyberdecksDeckProvider';
import { MeleeDeckProvider } from '../MeleeDeckProvider';
import { MySwuDeckProvider } from '../MySwuDeckProvider';
import { NiamosDeckProvider } from '../NiamosDeckProvider';
import { ProtectThePodDeckProvider } from '../ProtectThePodDeckProvider';
import { SwubaseDeckProvider } from '../SwubaseDeckProvider';
import { SwucardhubDeckProvider } from '../SwucardhubDeckProvider';
import { SwudbDeckProvider } from '../SwudbDeckProvider';
import { SwuforgeDeckProvider } from '../SwuforgeDeckProvider';
import { SwumetastatsDeckProvider } from '../SwumetastatsDeckProvider';
import { SwUnlimitedDbDeckProvider } from '../SwUnlimitedDbDeckProvider';
import { SwustatsDeckProvider } from '../SwustatsDeckProvider';
import { buildTagStyle } from './tagStyle';
import { DeckFetchError, DeckFetchErrorReason } from './types';

/**
 * Ordered list of deck-builder providers consulted by
 * {@link fetchExternalDeckListAsync}. The first provider whose `matches`
 * returns true wins, so providers whose `hostNameMatch` could substring-
 * match another provider's URL must come earlier.
 *
 * Adding a new provider: create a `XxxProvider extends DeckProviderBase`
 * subclass under `deckProviders/`, then add one import and one instance
 * here. The DeckSource enum, the supported-hosts list, the
 * `determineDeckSource` lookup, and the DeckPage tag styling all derive
 * themselves from this array.
 */
const providers: readonly DeckProviderBase[] = [
    new SwustatsDeckProvider(),
    new SwudbDeckProvider(),
    new MeleeDeckProvider(),
    new SwUnlimitedDbDeckProvider(),
    new SwucardhubDeckProvider(),
    new SwubaseDeckProvider(),
    new SwumetastatsDeckProvider(),
    new MySwuDeckProvider(),
    new NiamosDeckProvider(),
    new ProtectThePodDeckProvider(),
    new SwuforgeDeckProvider(),
    new KyberdecksDeckProvider(),
    new CardcoreDeckProvider(),
    new HoloscanDeckProvider(),
];

/**
 * Resolve a deck link from any registered provider directly from the
 * browser. Throws {@link DeckFetchError} (never a plain `Error`) so callers
 * can switch on `error.reason` for UX.
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

/**
 * Returns the {@link DeckSource} for a deck link, or `DeckSource.NotSupported`
 * if no provider matches. Pure substring/regex matching — no network calls.
 */
export function determineDeckSource(deckLink: string): DeckSource {
    return providers.find((p) => p.matches(deckLink))?.source ?? DeckSource.NotSupported;
}

/** Sorted list of supported host names (e.g. `swustats.net`), excluding providers marked `hiddenFromPublicList`. */
export const supportedDeckHosts: readonly string[] =
    providers.filter((p) => !p.hiddenFromPublicList).map((p) => p.displayName).sort();

/** Lookup from {@link DeckSource} -> per-provider tag SX block. */
export const deckSourceTagStyles: Readonly<Record<string, SxProps<Theme>>> =
    Object.fromEntries(providers.map((p) => [p.source, buildTagStyle(p.tagColor)]));

