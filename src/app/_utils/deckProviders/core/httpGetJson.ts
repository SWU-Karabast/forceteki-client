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
 * In local dev the request is routed through `/api/deck-proxy` because
 * several providers scope their CORS allowlist to `https://karabast.net`,
 * which rejects the `http://localhost:3000` dev origin. The proxy is
 * CORS-faithful: it still fails (502 `CORS_MISCONFIGURED`) when a provider
 * would not allow the production origin, so genuine CORS misconfigurations
 * are still caught during local testing rather than masked.
 *
 * Throws {@link DeckFetchError} with reason `NetworkError` if `fetch` itself
 * rejects. Non-OK HTTP responses are returned as-is so providers can apply
 * their own status-specific error mapping.
 */
export async function httpGetJson(url: string, providerName?: string): Promise<Response> {
    const isDev = process.env.NODE_ENV === 'development';
    const requestUrl = isDev ? `/api/deck-proxy?url=${encodeURIComponent(url)}` : url;

    let response: Response;
    try {
        response = await fetch(requestUrl, {
            method: 'GET',
            cache: 'no-store',
            signal: AbortSignal.timeout(5000),
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

    // Surface a clear error when the dev proxy detects that the provider's
    // CORS config would block the production origin. Without this, the
    // generic 502 would be mapped to an opaque ProviderError.
    if (isDev && response.status === 502) {
        const data = await response.clone().json().catch(() => null);
        if (data?.error === 'CORS_MISCONFIGURED') {
            throw new DeckFetchError(
                DeckFetchErrorReason.ProviderError,
                data.message ?? 'Provider CORS configuration would block production.',
                502,
                providerName,
            );
        }
    }

    return response;
}

