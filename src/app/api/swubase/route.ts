import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/_utils/auth';

export const dynamic = 'force-dynamic';

const CONFIG = {
    swuBase: {
        linkActivationUrl: process.env.NODE_ENV === 'development' && process.env.SWUBASE_LOCAL_DEV === 'true'
            ? 'http://localhost:5173/api/integration/link-confirm'
            : 'https://swubase.com/api/integration/link-confirm',
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
        if (!session?.user?.userId) {
            throw new Error('No valid user session');
        }
        if (session.user.userId !== linkedUserId) {
            throw new Error('User ID mismatch in SWU Base link');
        }
        await linkUserToSwuBase(session.user.userId, linkToken);
        return NextResponse.redirect(new URL(CONFIG.redirects.success, CONFIG.returnUrl));
    } catch (error) {
        console.error('[SWUBase] Callback failed:', error instanceof Error ? error.message : error);
        return NextResponse.redirect(new URL(CONFIG.redirects.error, CONFIG.returnUrl));
    }
}

async function linkUserToSwuBase(userId: string, linkToken: string) {
    const response = await fetch(`${CONFIG.gameServerUrl}/api/link-swubase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, linkToken: linkToken, internalApiKey: process.env.INTRASERVICE_SECRET }),
    });

    if (!response.ok) {
        throw new Error(`Failed to link account: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error('Account linking was unsuccessful');
    }
}