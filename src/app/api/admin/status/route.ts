import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/app/_utils/AdminAuth';

// Simple endpoint to check admin status
export const GET = withAdminAuth(async (request: NextRequest, context: any) => {
    return NextResponse.json(
        {
            success: true,
            message: 'You have admin access',
            user: {
                name: context.user?.name,
                id: context.user?.id
            },
            timestamp: new Date().toISOString()
        },
        { status: 200 }
    );
});