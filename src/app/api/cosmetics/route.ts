import { NextResponse } from 'next/server';
import { fetchCosmeticsDataAsync } from '@/app/_utils/fetchCosmeticsData';

export async function GET() {
    try {
        const cosmetics = await fetchCosmeticsDataAsync();
        return NextResponse.json({ ...cosmetics }, { status: 200 });
    } catch (error) {
        console.error('Error fetching cosmetics:', error);
        return NextResponse.json(
            { error: 'Error fetching cosmetics' },
            { status: 500 }
        );
    }
}