export const buildSwuStatsAuthUrl = (): string => {
    const baseUrl = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://karabast.net';

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.SWUSTATS_CLIENT_ID!,
        redirect_uri: `${baseUrl}/api/swustats`,
        scope: 'decks email profile'
    });

    return `https://swustats.net/TCGEngine/APIs/OAuth/authorize.php?${params.toString()}`;
};