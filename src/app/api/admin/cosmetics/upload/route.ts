import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbServiceAsync } from '@/app/_services/DynamoDBService';
import { CosmeticOption } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { withAdminAuth } from '@/app/_utils/AdminAuth';

export const POST = withAdminAuth(async (request: NextRequest) => {
    try {
        const dynamoService = await getDynamoDbServiceAsync();

        if (!dynamoService) {
            return NextResponse.json(
                {
                    error: 'DynamoDB service not available',
                    details: 'Check AWS credentials in environment variables'
                },
                { status: 500 }
            );
        }

        const cosmeticData: CosmeticOption = await request.json();

        // Validate required fields
        if (!cosmeticData.id || !cosmeticData.title || !cosmeticData.type || !cosmeticData.path) {
            return NextResponse.json(
                { error: 'Missing required fields: id, title, type, and path are required' },
                { status: 400 }
            );
        }

        // Validate cosmetic type
        if (!['cardback', 'background', 'playmat'].includes(cosmeticData.type)) {
            return NextResponse.json(
                { error: 'Invalid cosmetic type. Must be cardback, background, or playmat' },
                { status: 400 }
            );
        }

        // Check if cosmetic with this ID already exists
        const existingCosmetics = await dynamoService.getCosmeticsAsync();
        const existingCosmetic = existingCosmetics.find(c => c.id === cosmeticData.id);

        if (existingCosmetic) {
            return NextResponse.json(
                { error: `Cosmetic with ID '${cosmeticData.id}' already exists` },
                { status: 409 }
            );
        }

        // Save the cosmetic to DynamoDB
        await dynamoService.saveCosmeticAsync(cosmeticData);

        return NextResponse.json(
            {
                success: true,
                message: 'Cosmetic uploaded successfully',
                cosmetic: cosmeticData
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error uploading cosmetic:', error);
        return NextResponse.json(
            {
                error: 'Error uploading cosmetic',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
});