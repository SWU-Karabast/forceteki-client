export const dynamic = 'force-dynamic';

import { DeckSource, IDeckData } from '@/app/_utils/fetchDeckData';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const deckLink = searchParams.get('deckLink');

        if (!deckLink) {
            console.error('Error: Missing deckLink');
            return NextResponse.json({ error: 'Missing deckLink' }, { status: 400 });
        }

        let response: Response;
        let deckSource = DeckSource.NotSupported;
        let deckIdentifier: string = '';

        if (deckLink.includes('swustats.net')) {
            const gameNameMatch = deckLink.match(/gameName=([^&]+)/);
            const gameName = gameNameMatch ? gameNameMatch[1] : null;

            if (!gameName) {
                console.error('Error: Invalid deckLink format');
                return NextResponse.json(
                    { error: 'Invalid deckLink format' },
                    { status: 400 }
                );
            }
            deckSource = DeckSource.SWUStats;
            deckIdentifier = gameName;
            const apiUrl = `https://swustats.net/TCGEngine/APIs/LoadDeck.php?deckID=${gameName}&format=json&setId=true`;

            response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
            if (!response.ok) {
                if(response.status === 404 || response.status === 500) {
                    return NextResponse.json({ error: 'Deck not found. Make sure the deck exists on swustats.net.' }, { status: 404 });
                }
                
                console.error('SWUSTATS API error:', response.statusText);
                throw new Error(`SWUSTATS API error: ${response.statusText}`);
            }
        }
        else if (deckLink.includes('swudb.com')) {
            const match = deckLink.match(/\/([^\/]+)\/?$/);
            const deckId = match ? match[1] : null;
            if(deckId != null) deckIdentifier = deckId;
            deckSource = DeckSource.SWUDB;
            if (!deckId) {
                console.error('Error: Invalid deckLink format');
                return NextResponse.json(
                    { error: 'Invalid deckLink format' },
                    { status: 400 }
                );
            }

            const apiUrl = `https://swudb.com/api/getDeckJson/${deckId}`;

            response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
            if (!response.ok) {
                if(response.status === 403) {
                    return NextResponse.json({ error: 'Deck is set to Private. Change deck to unlisted on swudb' }, { status: 403 });
                }
                if(response.status === 404) {
                    return NextResponse.json({ error: 'Deck not found. Make sure the deck exists on swudb.com.' }, { status: 404 });
                }
                console.error('SWUDB API error:', response.statusText);
                throw new Error(`SWUDB API error: ${response.statusText}`);
            }
        }
        else if (deckLink.includes('sw-unlimited-db.com')) {
            const match = deckLink.match(/\/decks\/(\d+)\/?$/);
            const deckId = match ? match[1] : null;
            if(deckId != null) deckIdentifier = deckId;
            deckSource = DeckSource.SWUnlimitedDB;
            if (!deckId) {
                console.error('Error: Invalid deckLink format');
                return NextResponse.json(
                    { error: 'Invalid deckLink format' },
                    { status: 400 }
                );
            }

            const apiUrl = `https://sw-unlimited-db.com/umbraco/api/deckapi/get?id=${deckId}`;

            response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
            if (!response.ok) {
                if(response.status === 404) {
                    return NextResponse.json({ error: 'Deck not found. Make sure it is set to Published on sw-unlimited-db.' }, { status: 404 });
                }
                console.error('SW-Unlimited-DB API error:', response.statusText);
                throw new Error(`SW-Unlimited-DB API error: ${response.statusText}`);
            }
        } 
        else if (deckLink.includes('swucardhub.fr')) {
            const match = deckLink.match(/\/Karabast\/(\d+)\/?$/);
            const deckId = match ? match[1] : null;
            if(deckId != null) deckIdentifier = deckId;
            deckSource = DeckSource.SWUCardHub;
            if (!deckId) {
                console.error('Error: Invalid deckLink format');
                return NextResponse.json(
                    { error: 'Invalid deckLink format' },
                    { status: 400 }
                );
            }

            const apiUrl = `https://swucardhub.fr/Karabast/${deckId}`;

            response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
            if (!response.ok) {
                if(response.status === 404) {
                    return NextResponse.json({ error: 'Deck not found. Make sure it is set to Published on swucardhub.fr.' }, { status: 404 });
                }
                console.error('SWUCardHub API error:', response.statusText);
                throw new Error(`SWUCardHub API error: ${response.statusText}`);
            }
        } 
        else if (deckLink.includes('swubase.com')) {
            // Deck Links in the form: https://swubase.com/decks/${deckId}
            const match = deckLink.match(/\/decks\/([^\/]+)\/?$/);
            const deckId = match ? match[1] : null;
            if(deckId != null) deckIdentifier = deckId;
            deckSource = DeckSource.SWUBase;

            if (!deckId) {
                console.error('Error: Invalid deckLink format');
                return NextResponse.json(
                    { error: 'Invalid deckLink format' },
                    { status: 400 }
                );
            }

            const apiUrl = `https://swubase.com/api/deck/${deckId}/json`;

            response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
            if (!response.ok) {
                if(response.status === 404) {
                    // SWUBase returns 404 for private decks. We'll forward it to a 403 to get the correct message to the user.
                    return NextResponse.json({ error: 'Deck not found. Make sure the deck is set to Public on swubase.com.' }, { status: 403 });
                }

                console.error('SWUBase API error:', response.statusText);
                throw new Error(`SWUBase API error: ${response.statusText}`);
            }
        }
        else if (deckLink.includes('swumetastats.com')) {
            const match = deckLink.match(/\/decklists\/([^\/]+)\/?$/);
            const deckId = match ? match[1] : null;
            if(deckId != null) deckIdentifier = deckId;
            deckSource = DeckSource.SWUMetaStats;
            if (!deckId) {
                console.error('Error: Invalid deckLink format');
                return NextResponse.json(
                    { error: 'Invalid deckLink format' },
                    { status: 400 }
                );
            }

            const apiUrl = `https://www.swumetastats.com/api/decklists/${deckId}/json`;

            response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
            if (!response.ok) {
                console.error('SWUMetaStats API error:', response.statusText);
                throw new Error(`SWUMetaStats API error: ${response.statusText}`);
            }
        } else {
            console.error('Error: Deckbuilder not supported');
            return NextResponse.json({ error: 'Deckbuilder not supported' }, { status: 400 });
        }

        const data: IDeckData = await response.json();
        data.deckSource = deckSource;
        data.deckID = deckIdentifier;

        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Internal Server Error:', error.message);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.error('Unexpected error:', error);
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
