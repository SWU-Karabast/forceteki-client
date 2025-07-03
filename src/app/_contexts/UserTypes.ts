export interface IUser {
    id?: string;
    username?: string;
    email: string | null;
    provider: string | null;
    providerId: string | null;
    showWelcomeMessage?: boolean,
    authenticated: boolean,
    preferences: Preferences,
    needsUsernameChange?: boolean,
}

export interface Preferences {
    cardback?: string;
    sound?: {
        muteAllSound?: boolean;
        volume?: number;
        muteCardClickSound?: boolean;
        muteMenuButtonsSound?: boolean;
        muteChatSound?: boolean;
        muteOpponentFoundSound?: boolean;
    };
}

export interface IUserContextType {
    user: IUser | null;
    anonymousUserId: string | null;
    login: (provider: 'google' | 'discord') => void;
    devLogin: (user: 'Order66' | 'ThisIsTheWay') => void;
    logout: () => void;
    updateUsername: (username: string) => void;
    updateWelcomeMessage: () => void;
    updateNeedsUsernameChange: () => void;
    updateUserPreferences: (preferences: Preferences) => void;
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
            userId?: string | null;
        };
    }
}

declare module 'next-auth/jwt'{
    interface JWT {
        id?: string;
        name?: string;
        email?: string;
        picture?: string;
        provider?: string;
        providerId?: string;
        userId?: string;
    }
}