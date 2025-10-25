import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_utils/auth';

// List of allowed usernames for admin access - must match exactly what NextAuth provides
const allowedAdminUsers = [
    'Veld',
    'SWU Petranaki', // Exact match for what NextAuth session provides
    'CheBato'
];

/**
 * Check if a username has admin privileges
 * Uses exact string matching for security
 */
function isAdminUser(username?: string | null): boolean {
    return Boolean(username && allowedAdminUsers.includes(username));
}

/**
 * Middleware to check if the current user has admin/mod privileges
 * Returns user object if authorized, throws error if not
 */
export async function requireAdminAuth(request: NextRequest) {
    try {
        // Get the session from the request
        const session = await getServerSession(authOptions);

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
        const username = session.user.name; // NextAuth typically stores the username in 'name'
        if (!isAdminUser(username)) {
            return NextResponse.json(
                {
                    error: 'Insufficient privileges',
                    details: `Admin access required for this operation. User: ${username || 'unknown'}`
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

/**
 * Higher-order function to wrap API routes with admin authentication
 */
export function withAdminAuth(handler: (request: NextRequest, context: any) => Promise<NextResponse>) {
    return async (request: NextRequest, context: any = {}) => {
        const authResult = await requireAdminAuth(request);

        // If authResult is a NextResponse (error), return it
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        // Add user to context and proceed with the original handler
        context.user = authResult.user;
        return handler(request, context);
    };
}