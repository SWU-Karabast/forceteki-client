import { NextRequest, NextResponse } from 'next/server';
import { getS3ServiceAsync } from '@/app/_services/S3Service';
import { getDynamoDbServiceAsync } from '@/app/_services/DynamoDBService';
import { CosmeticOption } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { withAdminAuth } from '@/app/_utils/AdminAuth';

export const POST = withAdminAuth(async (request: NextRequest) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const cosmeticId = formData.get('cosmeticId') as string;
        const cosmeticTitle = formData.get('cosmeticTitle') as string;
        const cosmeticType = formData.get('cosmeticType') as string;

        if (!file || !cosmeticId || !cosmeticTitle || !cosmeticType) {
            return NextResponse.json(
                { error: 'Missing required fields: file, cosmeticId, cosmeticTitle, and cosmeticType are required' },
                { status: 400 }
            );
        }

        // Validate cosmetic type
        if (!['cardback', 'background', 'playmat'].includes(cosmeticType)) {
            return NextResponse.json(
                { error: 'Invalid cosmetic type. Must be cardback, background, or playmat' },
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

        // Get file extension
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExtension)) {
            return NextResponse.json(
                { error: 'Unsupported file type. Please use JPG, PNG, or WebP' },
                { status: 400 }
            );
        }

        // Initialize services
        const s3Service = await getS3ServiceAsync();
        const dynamoService = await getDynamoDbServiceAsync();

        if (!s3Service) {
            return NextResponse.json(
                { error: 'S3 service not available. Check AWS credentials.' },
                { status: 500 }
            );
        }

        if (!dynamoService) {
            return NextResponse.json(
                { error: 'DynamoDB service not available' },
                { status: 500 }
            );
        }

        // Check if cosmetic with this ID already exists
        const existingCosmetics = await dynamoService.getCosmeticsAsync();
        const existingCosmetic = existingCosmetics.find(c => c.id === cosmeticId);

        if (existingCosmetic) {
            return NextResponse.json(
                { error: `Cosmetic with ID '${cosmeticId}' already exists` },
                { status: 409 }
            );
        }

        // Generate S3 key
        const s3Key = `${cosmeticType}s/${cosmeticId}.${fileExtension}`;

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload to S3
        const s3Url = await s3Service.uploadFile(s3Key, fileBuffer, file.type);

        // Create cosmetic metadata
        const cosmeticData: CosmeticOption = {
            id: cosmeticId,
            title: cosmeticTitle,
            type: cosmeticType as 'cardback' | 'background' | 'playmat',
            path: s3Url,
            darkened: cosmeticType === 'background' // Only backgrounds can be darkened
        };

        // Save to DynamoDB
        await dynamoService.saveCosmeticAsync(cosmeticData);

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