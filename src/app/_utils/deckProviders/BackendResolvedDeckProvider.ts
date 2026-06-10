import { IDeckData } from '../deckTypes';
import { DeckProviderBase } from './DeckProviderBase';
import { DeckFetchError, DeckFetchErrorReason } from './types';

/**
 * Abstract base for providers whose decks are resolved by the Karabast
 * backend rather than fetched directly from the deck-builder's API. The
 * BE endpoint (`/api/resolve-deck-link`) knows how to scrape/parse each
 * supported deck-builder and returns a normalized {@link IDeckData}.
 *
 * Subclasses only need to declare `source`, `displayName`, `hostNameMatch`,
 * and `tagColor`; the BE POST and status mapping are shared here.
 *
 * IMPORTANT: most server-side code paths that need to fetch one of these
 * decks already have inline support on the BE. This class exists so the
 * browser-side `fetchExternalDeckListAsync` flow handles these links
 * transparently alongside the directly-fetched ones. Prefer the BE's
 * inline support over calling these providers from BE code.
 */
export abstract class BackendResolvedDeckProvider extends DeckProviderBase {
    // The base-class template (parseDeckId / buildApiUrl / httpGetJson)
    // does not apply because resolution requires a credentialed POST to
    // our own BE. We override fetchAsync directly. `buildApiUrl` is still
    // required by the abstract base but is unused here.
    protected buildApiUrl(): string {
        throw new Error(
            `${this.displayName}: does not use buildApiUrl; fetchAsync is overridden.`,
        );
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
            deckSource: this.source,
        };
    }
}
