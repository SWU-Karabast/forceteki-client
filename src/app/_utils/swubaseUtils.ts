'use server'

export async function getSwubaseAuthUrl(userId: string): Promise<string> {
    const baseKarabastUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://karabast.net';
    const baseSwubaseUrl = process.env.NODE_ENV === 'development' && process.env.SWUBASE_LOCAL_DEV === 'true'
        ? 'http://localhost:5173'
        : 'https://swubase.com';

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.NEXT_PUBLIC_SWUBASE_CLIENT_ID!,
        redirect_uri: `${baseKarabastUrl}/api/swubase`,
        scope: 'decks email profile teams',
        karabast_user_id: userId,
    });

    return `${baseSwubaseUrl}/settings/link/karabast?${params.toString()}`;
}