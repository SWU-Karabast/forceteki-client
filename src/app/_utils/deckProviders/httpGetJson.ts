import { DeckFetchError, DeckFetchErrorReason } from './types';

/**
 * Shared GET helper used by every deck-builder provider. Enforces
 * `cache: 'no-store'` so the browser never serves a cached deck.
 *
 * No custom request headers are sent: doing so (e.g. `Cache-Control` /
 * `Pragma`) would turn every request into a CORS-preflighted one, and
 * several provider origins only advertise `Access-Control-Allow-Headers:
 * Content-Type`, which would fail the preflight even though the actual GET
 * would otherwise succeed.
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
