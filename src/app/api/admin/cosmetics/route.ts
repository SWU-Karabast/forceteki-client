import { NextRequest, NextResponse } from 'next/server';
import { getServerApiService } from '@/app/_services/ServerApiService';
import { getS3ServiceAsync } from '@/app/_services/S3Service';
import { withAdminAuth } from '@/app/_utils/AdminAuth';

export const GET = withAdminAuth(async (request: NextRequest) => {
    try {
        const serverApiService = getServerApiService();
        const s3Service = await getS3ServiceAsync();

        // Check service availability
        const serviceStatus = {
            server: true, // We'll assume server is available if we can make the call
            s3: s3Service !== null
        };

        if (!s3Service) {
            return NextResponse.json(
                {
                    error: 'S3 service not available',
                    details: 'Check AWS S3 credentials in environment variables',
                    serviceStatus
                },
                { status: 500 }
            );
        }

        try {
            const cosmetics = await serverApiService.getCosmeticsAsync();

            return NextResponse.json(
                {
                    success: true,
                    cosmetics,
                    count: cosmetics.length,
                    message: cosmetics.length > 0 ? 'Cosmetics found in server' : 'No cosmetics found in server',
                    serviceStatus
                },
                { status: 200 }
            );
        } catch (serverError) {
            serviceStatus.server = false;
            return NextResponse.json(
                {
                    error: 'Server API not available',
                    details: serverError instanceof Error ? serverError.message : 'Unknown server error',
                    serviceStatus
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error fetching cosmetics from server:', error);
        return NextResponse.json(
            {
                error: 'Error fetching cosmetics from server',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
});

export const POST = withAdminAuth(async (_request: NextRequest) => {
    try {
        const serverApiService = getServerApiService();
        const s3Service = await getS3ServiceAsync();

        // Check service availability
        const serviceStatus = {
            server: true,
            s3: s3Service !== null
        };

        if (!s3Service) {
            return NextResponse.json(
                {
                    error: 'S3 service not available',
                    details: 'Check AWS S3 credentials in environment variables',
                    serviceStatus
                },
                { status: 500 }
            );
        }

        try {
            // Check if cosmetics already exist
            const existingCosmetics = await serverApiService.getCosmeticsAsync();

            if (existingCosmetics.length > 0) {
                return NextResponse.json(
                    {
                        success: true,
                        message: `Found ${existingCosmetics.length} existing cosmetics in server`,
                        cosmetics: existingCosmetics,
                        serviceStatus
                    },
                    { status: 200 }
                );
            }

            return NextResponse.json(
                {
                    success: true,
                    message: 'No cosmetics found. They will be auto-initialized on first fetchCosmeticsDataAsync call.',
                    suggestion: 'Call the /api/cosmetics endpoint to trigger initialization',
                    serviceStatus
                },
                { status: 200 }
            );
        } catch (serverError) {
            serviceStatus.server = false;
            return NextResponse.json(
                {
                    error: 'Server API not available',
                    details: serverError instanceof Error ? serverError.message : 'Unknown server error',
                    serviceStatus
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in cosmetics admin operation:', error);
        return NextResponse.json(
            {
                error: 'Error accessing server API',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
});