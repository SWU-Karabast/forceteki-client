import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_utils/auth';

// List of allowed user IDs for admin access - must match exactly what NextAuth provides
const allowedAdminUsers = [
    '4644b207-9307-4b78-8df7-69493f97c920',// ninin
];

export function isAdminUser(userId?: string | null): boolean {
    return Boolean(process.env.NODE_ENV === 'development' || (userId && allowedAdminUsers.includes(userId)));
}

/**
 * Middleware to check if the current user has admin/mod privileges
 * Returns user object if authorized, throws error if not
 */
export async function requireAdminAuth(request: NextRequest) {
    try {
        // Get the session from the request
        const session = await getServerSession(authOptions);
        console.log('Admin auth session:', session);
        if (!session?.user) {
            return NextResponse.json(
                {
                    error: 'Authentication required',
                    details: 'You must be logged in to access admin functions'
                },
                { status: 401 }
            );
        }

        // Check if user has admin privileges using the username from NextAuth
        const userId = session.user.id; // NextAuth typically stores the user ID in 'id'
        if (!isAdminUser(userId)) {
            return NextResponse.json(
                {
                    error: 'Insufficient privileges',
                    details: `Admin access required for this operation. User: ${userId || 'unknown'}`
                },
                { status: 403 }
            );
        }

        // Return the authenticated user
        return { user: session.user };
    } catch (error) {
        console.error('Admin auth check failed:', error);
        return NextResponse.json(
            {
                error: 'Authentication failed',
                details: 'Unable to verify admin privileges'
            },
            { status: 500 }
        );
    }
}

interface AdminContext {
    user?: {
        [key: string]: unknown;
    };
};

export function withAdminAuth(handler: (request: NextRequest, context: AdminContext) => Promise<NextResponse>) {
    return async (request: NextRequest, context: AdminContext = {}) => {
        const authResult = process.env.NODE_ENV === 'development'
            ? { user: { name: 'DevAdmin' } }
            : await requireAdminAuth(request);

        // If authResult is a NextResponse (error), return it
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Add user to context and proceed with the original handler
        context.user = authResult.user;
        return handler(request, context);
    };
}