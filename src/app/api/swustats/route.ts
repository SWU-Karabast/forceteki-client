export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const redirectUri =
        process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000/api/swustats'
            : 'https://karabast.net/api/swustats';
    const clientId = process.env.STATS_CLIENT_ID!;
    const clientSecret = process.env.SWU_STATS_CLIENT_SECRET!;

    const tokenResp = await fetch('https://swustats.net/TCGEngine/APIs/OAuth/token.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
        }),
    });

    const data = await tokenResp.json();
    console.log('SWUstats token response:', data);

    if (data?.access_token) {
        // TODO: save data.access_token, refresh token
        return redirect('/preferences?swustats=success');
    }
    return redirect('/settings?swustats=error');
}
