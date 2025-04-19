export interface IUser {
    id: string | null;
    username: string | null;
    email: string | null;
    provider: string | null;
    providerId: string | null;
}

export interface IUserContextType {
    user: IUser | null;
    anonymousUserId: string | null;
    login: (provider: 'google' | 'discord') => void;
    devLogin: (user: 'Order66' | 'ThisIsTheWay') => void;
    logout: () => void;
    updateUsername: (username: string) => void,
}

// Extend Next-auth types
declare module 'next-auth' {
    interface User {
        id: string;
        provider: string;
    }

    interface Session {
        jwtToken: string;
        user: {
            id: string | null;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            provider: string;
        };
    }
}