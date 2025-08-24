import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/_utils/auth';

export const dynamic = 'force-dynamic';

interface SwuStatsToken {
    accessToken: string;
    refreshToken: string;
    creationDateTime: Date;
    timeToLive: number;
}

const CONFIG = {
    swuStats: {
        tokenUrl: 'https://swustats.net/TCGEngine/APIs/OAuth/token.php',
        redirectUri: process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000/api/swustats'
            : 'https://karabast.net/api/swustats',
        clientId: process.env.NEXT_PUBLIC_SWU_STATS_CLIENT_ID!,
        clientSecret: process.env.NEXT_PUBLIC_SWU_STATS_CLIENT_SECRET!,
    },
    redirects: {
        success: '/Preferences?swustats=success',
        error: '/Preferences?swustats=error',
    },
    gameServerUrl: process.env.NEXT_PUBLIC_ROOT_URL!,
};

export async function GET(req: Request) {
    const code = new URL(req.url).searchParams.get('code');

    if (!code) {
        console.error('[SWU Stats] Missing authorization code');
        return NextResponse.redirect(new URL(CONFIG.redirects.error, req.url));
    }

    try {
        // This is the only way we can get the user session
        const session = await getServerSession(authOptions);
        if (!session?.user?.userId) {
            throw new Error('No valid user session');
        }
        const token = await fetchSwuStatsTokens(code);
        await linkUserToSwuStats(session.user.userId, token);
        return NextResponse.redirect(new URL(CONFIG.redirects.success, req.url));
    } catch (error) {
        console.error('[SWU Stats] Callback failed:', error instanceof Error ? error.message : error);
        return NextResponse.redirect(new URL(CONFIG.redirects.error, req.url));
    }
}

async function fetchSwuStatsTokens(code: string): Promise<SwuStatsToken> {
    const response = await fetch(CONFIG.swuStats.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: CONFIG.swuStats.redirectUri,
            client_id: CONFIG.swuStats.clientId,
            client_secret: CONFIG.swuStats.clientSecret,
        }),
    });

    if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    if (!data?.refresh_token || !data?.access_token || !data?.expires_in) {
        throw new Error('Invalid token response from SWU Stats');
    }

    return {
        creationDateTime: new Date(),
        timeToLive: data.expires_in,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
    };
}

async function linkUserToSwuStats(userId: string, token: SwuStatsToken) {
    const response = await fetch(`${CONFIG.gameServerUrl}/api/link-swustats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, swuStatsToken: token, internalApiKey: process.env.NEXTAUTH_SECRET }),
    });

    if (!response.ok) {
        throw new Error(`Failed to link account: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error('Account linking was unsuccessful');
    }
}