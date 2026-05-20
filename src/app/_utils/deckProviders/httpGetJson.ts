import { DeckFetchError, DeckFetchErrorReason } from './types';

/**
 * Shared GET helper used by every deck-builder provider. Enforces:
 *   - `cache: 'no-store'` so the browser never serves a cached deck.
 *   - `Cache-Control: no-cache` / `Pragma: no-cache` request headers as
 *     redundant insurance against any intermediate forward-proxies that
 *     ignore the fetch cache mode.
 *
 * Throws {@link DeckFetchError} with reason `NetworkError` if `fetch` itself
 * rejects. Non-OK HTTP responses are returned as-is so providers can apply
 * their own status-specific error mapping.
 */
export async function httpGetJson(url: string, providerName?: string): Promise<Response> {
    try {
        return await fetch(url, {
            method: 'GET',
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Network error';
        throw new DeckFetchError(
            DeckFetchErrorReason.NetworkError,
            `Network error: ${message}`,
            undefined,
            providerName,
        );
    }
}
