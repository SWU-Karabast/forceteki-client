import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/_utils/auth';

export const dynamic = 'force-dynamic';

// SWU Stats deck interface from their API
interface ISwuStatsDeck {
    id: number;
    name: string;
    description: string;
    visibility: number;
    created_at: string;
    updated_at: string;
    is_favorite: boolean;
}

interface ISwuStatsDecksResponse {
    decks: ISwuStatsDeck[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        has_more: boolean;
    };
}

const CONFIG = {
    swuStats: {
        decksUrl: 'https://swustats.net/TCGEngine/APIs/UserAPIs/GetUserDecks.php',
    },
    gameServerUrl: process.env.NEXT_PUBLIC_ROOT_URL!,
};

/**
 * GET /api/swustats/decks
 * Fetches the user's decks from SWU Stats using their linked OAuth token
 * Query params:
 *   - favorites: 'true' to only return favorite decks
 *   - limit: number of decks to return (default: 100)
 *   - offset: pagination offset (default: 0)
 */
export async function GET(req: Request) {
    try {
        // Get the user session
        const session = await getServerSession(authOptions);
        if (!session?.user?.userId) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const favoritesOnly = searchParams.get('favorites') === 'true';
        const limit = searchParams.get('limit') || '100';
        const offset = searchParams.get('offset') || '0';

        // Fetch the user's SWU Stats access token from the game server
        const tokenResponse = await fetch(
            `${CONFIG.gameServerUrl}/api/user/${session.user.userId}/swustatsToken`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'x-internal-api-key': process.env.INTRASERVICE_SECRET || '',
                },
            }
        );

        if (!tokenResponse.ok) {
            if (tokenResponse.status === 404) {
                return NextResponse.json(
                    { error: 'SWU Stats account not linked' },
                    { status: 404 }
                );
            }
            throw new Error(`Failed to get SWU Stats token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.accessToken;

        if (!accessToken) {
            return NextResponse.json(
                { error: 'SWU Stats account not linked or token expired' },
                { status: 404 }
            );
        }

        // Build query params for SWU Stats API
        const swuStatsParams = new URLSearchParams({
            limit,
            offset,
            sort: 'name',
            order: 'asc',
        });

        if (favoritesOnly) {
            swuStatsParams.set('favorites', 'true');
        }

        // Fetch decks from SWU Stats
        const decksResponse = await fetch(
            `${CONFIG.swuStats.decksUrl}?${swuStatsParams.toString()}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!decksResponse.ok) {
            // If unauthorized, the token might be expired
            if (decksResponse.status === 401) {
                return NextResponse.json(
                    { error: 'SWU Stats token expired. Please re-link your account.' },
                    { status: 401 }
                );
            }
            throw new Error(`SWU Stats API error: ${decksResponse.status}`);
        }

        const decksData: ISwuStatsDecksResponse = await decksResponse.json();

        // Transform SWU Stats decks to our format
        const transformedDecks = decksData.decks.map((deck) => ({
            id: deck.id,
            name: deck.name,
            description: deck.description,
            isFavorite: deck.is_favorite,
            createdAt: deck.created_at,
            updatedAt: deck.updated_at,
            // Build the deck link for SWU Stats
            deckLink: `https://swustats.net/TCGEngine/Decks/Deck.php?gameName=${deck.id}`,
        }));

        // Sort favorites to the top
        transformedDecks.sort((a, b) => {
            if (a.isFavorite && !b.isFavorite) return -1;
            if (!a.isFavorite && b.isFavorite) return 1;
            return a.name.localeCompare(b.name);
        });

        return NextResponse.json({
            decks: transformedDecks,
            pagination: decksData.pagination,
        });
    } catch (error) {
        console.error('[SWU Stats Decks] Error:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: 'Failed to fetch decks from SWU Stats' },
            { status: 500 }
        );
    }
}
