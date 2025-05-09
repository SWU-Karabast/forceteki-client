export interface IUser {
    id?: string;
    username?: string;
    email: string | null;
    provider: string | null;
    providerId: string | null;
    welcomeMessageSeen?: boolean,
    authenticated: boolean,
    preferences: Preferences,
}

export interface Preferences {
    cardback?: string;
}

export interface IUserContextType {
    user: IUser | null;
    anonymousUserId: string | null;
    login: (provider: 'google' | 'discord') => void;
    devLogin: (user: 'Order66' | 'ThisIsTheWay') => void;
    logout: () => void;
    updateUsername: (username: string) => void
    updateWelcomeMessage: () => void
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