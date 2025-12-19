import { NextRequest, NextResponse } from 'next/server';
import { getS3ServiceAsync } from '@/app/_services/S3Service';
import { IRegisteredCosmeticOption, RegisteredCosmeticType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { withAdminAuth } from '@/app/_utils/AdminAuth';
import { AdminRole } from '@/app/_contexts/UserTypes';
import { ServerApiService } from '@/app/_services/ServerApiService';

// uploads the cosmetic file to S3 and saves the cosmetic metadata to the DB via the server API
export const POST = withAdminAuth(AdminRole.Moderator, async (request: NextRequest) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const cosmeticId = formData.get('cosmeticId') as string;
        const cosmeticTitle = formData.get('cosmeticTitle') as string;
        const cosmeticType = formData.get('cosmeticType') as string;
        const isDarkenedParam = formData.get('isDarkened') as string;

        if (!file || !cosmeticId || !cosmeticTitle || !cosmeticType) {
            return NextResponse.json(
                { error: 'Missing required fields: file, cosmeticId, cosmeticTitle, and cosmeticType are required' },
                { status: 400 }
            );
        }

        // Parse darkened parameter - default to true for backgrounds, false for others
        const isDarkened = cosmeticType === 'background' ?
            (isDarkenedParam ? isDarkenedParam === 'true' : true) :
            false;

        // Validate cosmetic type
        if (!['cardback', 'background'].includes(cosmeticType)) {
            return NextResponse.json(
                { error: 'Invalid cosmetic type. Must be cardback, background' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { error: 'File must be an image' },
                { status: 400 }
            );
        }

        // Get file extension and determine if conversion will happen
        const originalExtension = file.name.split('.').pop()?.toLowerCase();
        if (!originalExtension || !['jpg', 'jpeg', 'png', 'webp'].includes(originalExtension)) {
            return NextResponse.json(
                { error: 'Unsupported file type. Please use JPG, PNG, or WebP (PNG/JPEG will be converted to WebP)' },
                { status: 400 }
            );
        }

        // Always use webp extension for S3 key since PNG/JPEG will be converted to WebP
        const fileExtension = 'webp';

        // Initialize services
        const s3Service = await getS3ServiceAsync();

        if (!s3Service) {
            return NextResponse.json(
                { error: 'S3 service not available. Check AWS credentials.' },
                { status: 500 }
            );
        }

        // Check if cosmetic with this ID already exists
        try {
            const existingCosmetics = await ServerApiService.getCosmeticsAsync();
            const existingCosmetic = existingCosmetics.cosmetics.find(c => c.id === cosmeticId);

            if (existingCosmetic) {
                return NextResponse.json(
                    { error: `Cosmetic with ID '${cosmeticId}' already exists` },
                    { status: 409 }
                );
            }
        } catch (error) {
            // If we can't check existing cosmetics, we'll proceed but log the error
            console.warn('Could not check existing cosmetics from server:', error);
        }

        // Generate S3 key
        const s3Key = `${cosmeticType}s/${cosmeticId}.${fileExtension}`;

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload to S3
        const s3Url = await s3Service.uploadFile(s3Key, fileBuffer, 'image/webp');

        // Create cosmetic metadata
        const cosmeticData: IRegisteredCosmeticOption = {
            id: cosmeticId,
            title: cosmeticTitle,
            type: cosmeticType as RegisteredCosmeticType,
            path: s3Url,
            darkened: isDarkened // Use the parsed darkened parameter
        };

        // Forward cookies from the original request to the server API call
        const cookies = request.headers.get('cookie');

        // Save to server via API with cookies forwarded
        await ServerApiService.saveCosmeticAsync(cosmeticData, cookies || undefined);

        return NextResponse.json(
            {
                success: true,
                message: 'Cosmetic uploaded successfully',
                cosmetic: cosmeticData,
                s3Url: s3Url
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