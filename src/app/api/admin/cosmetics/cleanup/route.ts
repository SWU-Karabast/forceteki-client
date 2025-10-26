import { NextRequest, NextResponse } from 'next/server';
import { getS3ServiceAsync } from '@/app/_services/S3Service';
import { getServerApiService } from '@/app/_services/ServerApiService';
import { withAdminAuth } from '@/app/_utils/AdminAuth';

// Only allow cleanup operations in development
function checkDevelopmentMode() {
    if (process.env.NODE_ENV !== 'development') {
        throw new Error('Cleanup operations are only allowed in development mode');
    }
}

enum CleanupAction {
    Single = 'single',
    All = 'all',
    Reset = 'reset'
}

// DELETE endpoint to handle cleanup operations
export const DELETE = withAdminAuth(async (request: NextRequest) => {
    try {
        checkDevelopmentMode();

        const serverApiService = getServerApiService();
        const cookies = request.headers.get('cookie');

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const cosmeticId = searchParams.get('id');

        switch (action) {
            case CleanupAction.Single:
                if (!cosmeticId) {
                    return NextResponse.json(
                        { error: 'Cosmetic ID is required for single deletion' },
                        { status: 400 }
                    );
                }

                // First get the cosmetic to check if it has an associated file
                const cosmeticsForSingle = await serverApiService.getCosmeticsAsync();
                const cosmetic = cosmeticsForSingle.find((c) => c.id === cosmeticId);

                // Delete the file from S3 if it exists
                if (cosmetic?.path) {
                    try {
                        const s3Service = await getS3ServiceAsync();
                        if (s3Service) {
                            const s3Key = s3Service.extractKeyFromUrl(cosmetic.path);
                            if (s3Key) {
                                await s3Service.deleteFile(s3Key);
                            }
                        }
                    } catch (s3Error) {
                        console.warn(`Failed to delete S3 file for cosmetic ${cosmeticId}:`, s3Error);
                        // Continue with database deletion even if S3 deletion fails
                    }
                }

                await serverApiService.deleteCosmeticAsync(cosmeticId, cookies || undefined);

                return NextResponse.json(
                    {
                        success: true,
                        message: `Cosmetic '${cosmeticId}' deleted successfully`
                    },
                    { status: 200 }
                );

            case CleanupAction.All:
                // Get all cosmetics first to delete their associated files
                const allCosmetics = await serverApiService.getCosmeticsAsync();
                const s3Service = await getS3ServiceAsync();

                // Delete all files from S3
                if (s3Service) {
                    for (const cosmetic of allCosmetics) {
                        if (cosmetic.path) {
                            try {
                                const s3Key = s3Service.extractKeyFromUrl(cosmetic.path);
                                if (s3Key) {
                                    await s3Service.deleteFile(s3Key);
                                }
                            } catch (s3Error) {
                                console.warn(`Failed to delete S3 file for cosmetic ${cosmetic.id}:`, s3Error);
                                // Continue with next file deletion
                            }
                        }
                    }
                }

                const clearResult = await serverApiService.clearAllCosmeticsAsync(cookies || undefined);

                return NextResponse.json(
                    {
                        success: true,
                        message: `All cosmetics cleared (${clearResult.deletedCount} items deleted)`,
                        deletedCount: clearResult.deletedCount
                    },
                    { status: 200 }
                );

            case CleanupAction.Reset:
                // Get all cosmetics first to delete their associated files before reset
                const cosmeticsForReset = await serverApiService.getCosmeticsAsync();
                const s3ServiceForReset = await getS3ServiceAsync();

                // Delete all files from S3 (they will be replaced with defaults)
                if (s3ServiceForReset) {
                    for (const cosmetic of cosmeticsForReset) {
                        if (cosmetic.path) {
                            try {
                                const s3Key = s3ServiceForReset.extractKeyFromUrl(cosmetic.path);
                                if (s3Key) {
                                    await s3ServiceForReset.deleteFile(s3Key);
                                }
                            } catch (s3Error) {
                                console.warn(`Failed to delete S3 file for cosmetic ${cosmetic.id}:`, s3Error);
                                // Continue with next file deletion
                            }
                        }
                    }
                }

                const resetResult = await serverApiService.resetCosmeticsToDefaultAsync(cookies || undefined);

                return NextResponse.json(
                    {
                        success: true,
                        message: resetResult.message,
                        deletedCount: resetResult.deletedCount
                    },
                    { status: 200 }
                );

            default:
                return NextResponse.json(
                    {
                        error: 'Invalid action. Use: single (with id), all, or reset',
                        examples: [
                            'DELETE /api/admin/cosmetics/cleanup?action=single&id=my-cosmetic-id',
                            'DELETE /api/admin/cosmetics/cleanup?action=all',
                            'DELETE /api/admin/cosmetics/cleanup?action=reset'
                        ]
                    },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error in cosmetics cleanup:', error);
        return NextResponse.json(
            {
                error: 'Error during cleanup operation',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
});

// GET endpoint to show cleanup options (development only)
export const GET = async () => {
    try {
        checkDevelopmentMode();

        return NextResponse.json(
            {
                message: 'Cosmetics cleanup API (Development only)',
                availableActions: {
                    'Delete single cosmetic': 'DELETE /api/admin/cosmetics/cleanup?action=single&id={cosmeticId}',
                    'Clear all cosmetics': 'DELETE /api/admin/cosmetics/cleanup?action=all',
                    'Reset to defaults': 'DELETE /api/admin/cosmetics/cleanup?action=reset'
                },
                warning: 'These operations are irreversible in development. Use with caution.',
                currentEnv: process.env.NODE_ENV
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 403 }
        );
    }
};