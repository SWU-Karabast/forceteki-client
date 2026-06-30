import { NextRequest, NextResponse } from 'next/server';
import { supportedDeckHosts } from '@/app/_utils/deckProviders/core/registry';

export const dynamic = 'force-dynamic';

/**
 * Development-only proxy for directly-fetched deck providers.
 *
 * In local dev the browser's `Origin` is `http://localhost:3000`, which the
 * provider CORS allowlists (scoped to `https://karabast.net`) reject, so
 * every cross-origin GET fails even though it would succeed in production.
 *
 * This route lets the browser make a same-origin request that we forward
 * server-side. Crucially, it is **CORS-faithful**: it fetches the provider
 * AS IF it were the production origin and then enforces the exact check the
 * browser would. If the provider would not allow `PROD_ORIGIN`, we surface a
 * 502 `CORS_MISCONFIGURED` instead of silently succeeding — so a genuinely
 * broken provider CORS config still fails at the local dev testing step.
 */
const PROD_ORIGIN = 'https://karabast.net';

export async function GET(req: NextRequest) {
    const target = req.nextUrl.searchParams.get('url');
    if (!target) {
        return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    let host: string;
    try {
        host = new URL(target).hostname;
    } catch {
        return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
    }

    // SSRF guard: only ever proxy to known provider hosts, never an arbitrary
    // URL. Keeps this from being an open proxy.
    const hostAllowed = supportedDeckHosts.some(
        (h) => host === h || host.endsWith(`.${h}`),
    );
    if (!hostAllowed) {
        return NextResponse.json({ error: `Host not allowed: ${host}` }, { status: 403 });
    }

    let upstream: Response;
    try {
        // Send the production Origin so the provider returns the same
        // Access-Control-Allow-Origin it would in prod.
        upstream = await fetch(target, {
            method: 'GET',
            cache: 'no-store',
            headers: { Origin: PROD_ORIGIN },
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Network error';
        return NextResponse.json({ error: `Upstream fetch failed: ${message}` }, { status: 502 });
    }

    // Replicate the browser's CORS check against the production origin. These
    // requests are credential-less simple GETs, so '*' or an exact origin
    // match are both acceptable.
    const acao = upstream.headers.get('access-control-allow-origin');
    if (acao !== '*' && acao !== PROD_ORIGIN) {
        return NextResponse.json(
            {
                error: 'CORS_MISCONFIGURED',
                message:
                    `${host} returned Access-Control-Allow-Origin='${acao ?? '(none)'}', ` +
                    `which would block ${PROD_ORIGIN} in production.`,
            },
            { status: 502 },
        );
    }

    const body = await upstream.text();
    return new NextResponse(body, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' },
    });
}
