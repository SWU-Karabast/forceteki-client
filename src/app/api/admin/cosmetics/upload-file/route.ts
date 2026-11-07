import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getS3ServiceAsync } from '@/app/_services/S3Service';
import { ICosmeticEntity, RegisteredCosmeticType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { withAdminAuth } from '@/app/_utils/AdminAuth';
import { AdminRole } from '@/app/_contexts/UserTypes';
import { ServerApiError, ServerApiService } from '@/app/_services/ServerApiService';

/** The largest image the route accepts. */
const MaxCosmeticFileBytes = 10 * 1024 * 1024;

/** The game node's limit on a cosmetic's title. */
const MaxCosmeticTitleLength = 100;

/** Whether the bytes are a PNG, JPEG or WebP file, judged by their signature rather than the declared type or name. */
function isSupportedImage(bytes: Buffer): boolean {
    const isPng = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isWebp = bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
    return isPng || isJpeg || isWebp;
}

// uploads the cosmetic file to S3 and saves the cosmetic metadata to the DB via the server API
export const POST = withAdminAuth(AdminRole.Moderator, async (request: NextRequest) => {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const cosmeticTitle = formData.get('cosmeticTitle');
        const cosmeticType = formData.get('cosmeticType');

        if (!(file instanceof File) || typeof cosmeticTitle !== 'string' || !cosmeticTitle.trim() || typeof cosmeticType !== 'string') {
            return NextResponse.json(
                { error: 'Missing required fields: file, cosmeticTitle, and cosmeticType are required' },
                { status: 400 }
            );
        }

        if (cosmeticTitle.trim().length > MaxCosmeticTitleLength) {
            return NextResponse.json(
                { error: `The title must be at most ${MaxCosmeticTitleLength} characters` },
                { status: 400 }
            );
        }

        // Validate cosmetic type
        if (!['cardback', 'background'].includes(cosmeticType)) {
            return NextResponse.json(
                { error: 'Invalid cosmetic type. Must be cardback, background' },
                { status: 400 }
            );
        }

        // Moderators curate card backs; every other type belongs to admins (the game node's rule, checked here as
        // well so that nothing is written to the bucket for a type the caller may not add). Development skips
        // these checks, as withAdminAuth does.
        const cookies = request.headers.get('cookie') || undefined;
        if (cosmeticType !== RegisteredCosmeticType.Cardback && process.env.NODE_ENV !== 'development') {
            const isAdmin = await ServerApiService.userIsAdminAsync(cookies).catch(() => false);
            if (!isAdmin) {
                return NextResponse.json(
                    { error: 'Admin privileges are required to upload this cosmetic type' },
                    { status: 403 }
                );
            }
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

        if (file.size > MaxCosmeticFileBytes) {
            return NextResponse.json(
                { error: `The image must be at most ${MaxCosmeticFileBytes / (1024 * 1024)} MB` },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        if (!isSupportedImage(fileBuffer)) {
            return NextResponse.json(
                { error: 'The file is not a JPG, PNG, or WebP image' },
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

        // The id is made here, so it is always new and always safe to put in the object key
        const cosmeticId = randomUUID();
        const s3Key = `${cosmeticType}s/${cosmeticId}.${fileExtension}`;

        // Upload to S3
        const s3Url = await s3Service.uploadFile(s3Key, fileBuffer, 'image/webp');

        // Create cosmetic metadata
        const cosmeticData: ICosmeticEntity = {
            id: cosmeticId,
            title: cosmeticTitle.trim(),
            type: cosmeticType as RegisteredCosmeticType,
            path: s3Url,
        };

        // Save to server via API with cookies forwarded. Only a refusal (a 4xx answer) means nothing was registered, so
        // only then is the uploaded image removed again: after a server error or a lost answer the cosmetic may well
        // exist, and an image left over costs less than a listed cosmetic with no image.
        try {
            await ServerApiService.saveCosmeticAsync(cosmeticData, cookies);
        } catch (error) {
            if (!(error instanceof ServerApiError) || error.status < 400 || error.status >= 500) {
                throw error;
            }

            try {
                await s3Service.deleteFile(s3Key);
            } catch (deleteError) {
                console.error(`Could not remove the image of an unregistered cosmetic (${s3Key}):`, deleteError);
            }

            // pass the game node's reason on, so the mod page can show why
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

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
