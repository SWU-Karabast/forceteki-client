'use server'

function getBaseKarabastUrl(): string {
    return process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://karabast.net';
}

export async function getSwuStatsAuthUrl(): Promise<string> {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.SWUSTATS_CLIENT_ID!,
        redirect_uri: `${getBaseKarabastUrl()}/api/swustats`,
        scope: 'decks email profile'
    });

    return `https://swustats.net/TCGEngine/APIs/OAuth/authorize.php?${params.toString()}`;
}

export async function getSwubaseAuthUrl(userId: string): Promise<string> {
    if (!process.env.SWUBASE_CLIENT_ID) {
        throw new Error('SWUBASE_CLIENT_ID is not set');
    }

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.SWUBASE_CLIENT_ID,
        redirect_uri: `${getBaseKarabastUrl()}/api/swubase`,
        scope: 'decks email profile teams',
        karabast_user_id: userId,
    });

    return `https://swubase.com/settings/link/karabast?${params.toString()}`;
}