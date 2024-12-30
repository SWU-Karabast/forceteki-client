import { NextResponse } from 'next/server';

interface IDeckMetadata {
    name: string;
    author: string;
}

interface IDeckCard {
    id: string;
    count: number;
}

interface IDeckData {
    metadata: IDeckMetadata;
    leader: IDeckCard;
    secondleader: IDeckCard | null;
    base: IDeckCard;
    deck: IDeckCard[];
    sideboard: IDeckCard[];
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const deckLink = searchParams.get('deckLink');

        if (!deckLink) {
            console.error('Error: Missing deckLink');
            return NextResponse.json({ error: 'Missing deckLink' }, { status: 400 });
        }

        const match = deckLink.match(/\/deck\/(?:view\/)?([^/?]+)/);
        const deckId = match ? match[1] : null;

        if (!deckId) {
            console.error('Error: Invalid deckLink format');
            return NextResponse.json(
                { error: 'Invalid deckLink format' },
                { status: 400 }
            );
        }

        const apiUrl = `https://swudb.com/deck/view/${deckId}?handler=JsonFile`;

        const response = await fetch(apiUrl, { method: 'GET' });

        if (!response.ok) {
            console.error('SWUDB API error:', response.statusText);
            throw new Error(`SWUDB API error: ${response.statusText}`);
        }

        const data: IDeckData = await response.json();

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
