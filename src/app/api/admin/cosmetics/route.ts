import { NextRequest, NextResponse } from 'next/server';
import { getDynamoDbServiceAsync } from '@/app/_services/DynamoDBService';
import { getS3ServiceAsync } from '@/app/_services/S3Service';
import { withAdminAuth } from '@/app/_utils/AdminAuth';

export const GET = withAdminAuth(async (request: NextRequest) => {
    try {
        const dynamoService = await getDynamoDbServiceAsync();
        const s3Service = await getS3ServiceAsync();

        // Check service availability
        const serviceStatus = {
            dynamodb: dynamoService !== null,
            s3: s3Service !== null
        };

        if (!dynamoService) {
            return NextResponse.json(
                {
                    error: 'DynamoDB service not available',
                    details: 'Check AWS credentials in environment variables',
                    serviceStatus
                },
                { status: 500 }
            );
        }

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

        const cosmetics = await dynamoService.getCosmeticsAsync();

        return NextResponse.json(
            {
                success: true,
                cosmetics,
                count: cosmetics.length,
                message: cosmetics.length > 0 ? 'Cosmetics found in database' : 'No cosmetics found in database',
                serviceStatus
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error fetching cosmetics from DynamoDB:', error);
        return NextResponse.json(
            {
                error: 'Error fetching cosmetics from DynamoDB',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
});

export const POST = withAdminAuth(async (request: NextRequest) => {
    try {
        const dynamoService = await getDynamoDbServiceAsync();
        const s3Service = await getS3ServiceAsync();

        // Check service availability
        const serviceStatus = {
            dynamodb: dynamoService !== null,
            s3: s3Service !== null
        };

        if (!dynamoService) {
            return NextResponse.json(
                {
                    error: 'DynamoDB service not available',
                    details: 'Check AWS credentials in environment variables',
                    serviceStatus
                },
                { status: 500 }
            );
        }

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

        // Check if cosmetics already exist
        const existingCosmetics = await dynamoService.getCosmeticsAsync();

        if (existingCosmetics.length > 0) {
            return NextResponse.json(
                {
                    success: true,
                    message: `Found ${existingCosmetics.length} existing cosmetics in database`,
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
    } catch (error) {
        console.error('Error in cosmetics admin operation:', error);
        return NextResponse.json(
            {
                error: 'Error accessing DynamoDB',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
});