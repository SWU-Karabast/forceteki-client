import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const jsonFile = searchParams.get('jsonFile');
        if(!jsonFile) {
            console.error('Error: Missing parameter jsonFile');
            return NextResponse.json({ error: 'Missing parameter jsonFile', status: 400 });
        }
        const response = await fetch('https://karabast-data.s3.amazonaws.com/data/'+encodeURIComponent(jsonFile));

        if (!response.ok) {
            console.error('Failed to fetch card mapping:', response.statusText);
            return NextResponse.json({ error: 'Failed to fetch card mapping', status: 500 });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error) {
            console.error('Internal Server Error:', error.message);
            return NextResponse.json({ error: error.message, status: 500 });
        }

        return NextResponse.json(
            { error: 'An unexpected error occurred', status: 500 }
        );
    }
}
