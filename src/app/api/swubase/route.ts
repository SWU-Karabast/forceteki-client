import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/_utils/auth';

export const dynamic = 'force-dynamic';

const CONFIG = {
    swuBase: {
        linkActivationUrl: 'https://swubase.com/api/integration/link-confirm',
        redirectUri: process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000/api/swubase'
            : 'https://karabast.net/api/swubase',
    },
    redirects: {
        success: '/Preferences?swubase=success',
        error: '/Preferences?swubase=error',
    },
    gameServerUrl: process.env.NEXT_PUBLIC_ROOT_URL!,
    returnUrl: process.env.NEXTAUTH_URL,
};

export async function GET(req: Request) {
    const linkToken = new URL(req.url).searchParams.get('link_token');
    const linkedUserId = new URL(req.url).searchParams.get('karabast_user_id');

    if (!linkToken) {
        console.error('[SWUBase] Missing authorization linkToken');
        return NextResponse.redirect(new URL(CONFIG.redirects.error, CONFIG.returnUrl));
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.jwtToken || !linkedUserId) {
            throw new Error('No valid user session');
        }
        await linkUserToSwuBase(session.jwtToken, linkedUserId, linkToken);
        return NextResponse.redirect(new URL(CONFIG.redirects.success, CONFIG.returnUrl));
    } catch (error) {
        console.error('[SWUBase] Callback failed:', error instanceof Error ? error.message : error);
        return NextResponse.redirect(new URL(CONFIG.redirects.error, CONFIG.returnUrl));
    }
}

// The game server works out which account to link from the user's session token, which is forwarded as the cookie.
// The account id from the callback URL is sent too, and must match that account.
async function linkUserToSwuBase(sessionToken: string, expectedUserId: string, linkToken: string) {
    const response = await fetch(`${CONFIG.gameServerUrl}/api/link-swubase`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Cookie: `next-auth.session-token=${sessionToken}`,
        },
        body: JSON.stringify({ expectedUserId, linkToken: linkToken, internalApiKey: process.env.INTRASERVICE_SECRET }),
    });

    if (!response.ok) {
        throw new Error(`Failed to link account: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error('Account linking was unsuccessful');
    }
}