// Admin authentication middleware
import { NextRequest, NextResponse } from 'next/server';
import { ServerApiService } from '../_services/ServerApiService';

export function withAdminAuth(
    role: string,
    handler: (request: NextRequest) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        if(process.env.NODE_ENV === 'development') {
            return handler(request);
        }

        const cookies = request.headers.get('cookie') || undefined;

        try {
            let isAuthorized = false;
            switch(role) {
                case 'admin':
                    isAuthorized = await ServerApiService.userIsAdminAsync(cookies);
                    break;
                case 'dev':
                    isAuthorized = await ServerApiService.userIsDevAsync(cookies);
                    break;
                case 'mod':
                    isAuthorized = await ServerApiService.userIsModAsync(cookies);
                    break;
                default:
                    return NextResponse.json(
                        { error: 'Invalid admin role specified' },
                        { status: 500 }
                    );
            }

            if (!isAuthorized) {
                return NextResponse.json(
                    { error: 'Admin authentication failed or insufficient privileges' },
                    { status: 403 }
                );
            }
            return handler(request);
        } catch (error) {
            console.error('Error during admin authentication:', error);
            return NextResponse.json(
                { error: 'Internal Server Error during admin authentication' },
                { status: 500 }
            );
        }
    };
}