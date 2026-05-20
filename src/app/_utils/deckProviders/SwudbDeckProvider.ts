import { DeckSource, IDeckData } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';
import { DeckFetchError, DeckFetchErrorReason } from './types';

/**
 * SWUDB is a special case among deck providers: unlike the other sites
 * (which expose a public JSON endpoint we hit directly from the browser),
 * swudb.com requires server-side resolution. This provider routes through
 * our own `/api/resolve-deck-link` BE endpoint.
 *
 * IMPORTANT: most server-side code paths that need to fetch a swudb deck
 * have inline swudb support (the BE knows how to resolve a swudb URL on its
 * own). This provider exists primarily so that the browser-side
 * `fetchExternalDeckListAsync` flow can transparently handle swudb links
 * alongside everything else. Prefer the BE's inline swudb support wherever
 * possible rather than calling this provider from BE code.
 */
export class SwudbDeckProvider extends DeckProviderBase {
    public readonly source = DeckSource.SWUDB;
    public readonly displayName = 'swudb.com';
    public readonly hostNameMatch = 'swudb.com';
    public readonly tagColor = '#4CB5FF';

    // The base-class template (parseDeckId / buildApiUrl / httpGetJson) does
    // not apply to swudb because resolution requires a POST to our BE,
    // including credentials. We override fetchAsync directly. The
    // buildApiUrl abstract member must still be implemented; it's unused
    // here.
    protected buildApiUrl(): string {
        throw new Error('SwudbDeckProvider does not use buildApiUrl; fetchAsync is overridden.');
    }

    public override async fetchAsync(deckLink: string): Promise<IDeckData> {
        let response: Response;
        try {
            response = await fetch(
                `${process.env.NEXT_PUBLIC_ROOT_URL}/api/resolve-deck-link`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deckLink }),
                    credentials: 'include',
                },
            );
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Network error';
            throw new DeckFetchError(
                DeckFetchErrorReason.NetworkError,
                `Network error: ${message}`,
                undefined,
                this.displayName,
            );
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const message = errorData?.error ?? `Failed to fetch deck: ${response.status}`;
            if (response.status === 403) {
                throw new DeckFetchError(DeckFetchErrorReason.Private, message, response.status, this.displayName);
            }
            if (response.status === 404) {
                throw new DeckFetchError(DeckFetchErrorReason.NotFound, message, response.status, this.displayName);
            }
            throw new DeckFetchError(DeckFetchErrorReason.ProviderError, message, response.status, this.displayName);
        }

        const body = await response.json();
        return {
            ...(body.deck as IDeckData),
            deckSource: DeckSource.SWUDB,
        };
    }
}
