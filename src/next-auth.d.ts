// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NextAuth } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id?: string;
            name?: string;
            email?: string;
            image?: string;
            userId?: string;
            provider: string;
        };
    }

    interface User {
        id: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        sub?: string;
        provider?: string;
    }
}
