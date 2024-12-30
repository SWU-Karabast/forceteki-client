// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { NextAuth } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
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
