import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/_utils/auth';

export const dynamic = 'force-dynamic';

function getBaseKarabastUrl(): string {
    return process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://karabast.net';
}

const CONFIG = {
    redirects: {
        success: '/Preferences?swuforge=success',
        error: '/Preferences?swuforge=error',
    },
    gameServerUrl: process.env.NEXT_PUBLIC_ROOT_URL!,
    returnUrl: process.env.NEXTAUTH_URL,
};

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // contains the karabast userId

    if (!code) {
        console.error('[SWU Forge] Missing authorization code');
        return NextResponse.redirect(new URL(CONFIG.redirects.error, CONFIG.returnUrl));
    }

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.userId) {
            throw new Error('No valid user session');
        }
        if (state && session.user.userId !== state) {
            throw new Error('User ID mismatch in SWU Forge link');
        }

        const redirectUri = `${getBaseKarabastUrl()}/api/swuforge`;
        await linkUserToSwuForge(session.user.userId, code, redirectUri);
        return NextResponse.redirect(new URL(CONFIG.redirects.success, CONFIG.returnUrl));
    } catch (error) {
        console.error('[SWU Forge] Callback failed:', error instanceof Error ? error.message : error);
        return NextResponse.redirect(new URL(CONFIG.redirects.error, CONFIG.returnUrl));
    }
}

async function linkUserToSwuForge(userId: string, code: string, redirectUri: string) {
    const response = await fetch(`${CONFIG.gameServerUrl}/api/link-swuforge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId,
            code,
            redirectUri,
            internalApiKey: process.env.INTRASERVICE_SECRET,
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to link account: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
        throw new Error('Account linking was unsuccessful');
    }
}
