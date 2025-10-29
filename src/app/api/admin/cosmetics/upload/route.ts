import { NextRequest, NextResponse } from 'next/server';

import { IRegisteredCosmeticOption } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { withAdminAuth } from '@/app/_utils/AdminAuth';
import { getServerApiService } from '@/app/_services/ServerApiService';
import { AdminRole } from '@/app/_contexts/UserTypes';

export const POST = withAdminAuth(AdminRole.Moderator, async (request: NextRequest) => {
    try {
        const serverApiService = await getServerApiService();
        const cosmeticData: IRegisteredCosmeticOption = await request.json();
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
        const existingCosmetics = await serverApiService.getCosmeticsAsync();
        const existingCosmetic = existingCosmetics.find((c) => c.id === cosmeticData.id);

        if (existingCosmetic) {
            return NextResponse.json(
                { error: `Cosmetic with ID '${cosmeticData.id}' already exists` },
                { status: 409 }
            );
        }
        // Save the new cosmetic through the server API
        await serverApiService.saveCosmeticAsync(cosmeticData);

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