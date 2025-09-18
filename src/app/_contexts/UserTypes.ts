export interface IUser {
    id?: string;
    username?: string;
    email: string | null;
    provider: string | null;
    providerId: string | null;
    showWelcomeMessage?: boolean,
    authenticated: boolean,
    preferences: IPreferences,
    needsUsernameChange?: boolean,
    swuStatsRefreshToken: string | null,
    moderation?: IModeration,
}
export interface IModeration {
    days?: number;
    startDays?: Date | undefined;
    hasSeen?: boolean;
}

export interface IGetUser {
    id: string;
    username: string;
    showWelcomeMessage: boolean;
    preferences: IPreferences,
    needsUsernameChange: boolean;
    swuStatsRefreshToken?: string;
    moderation?: IModeration
}

export interface ISoundPreferences {
    muteAllSound?: boolean;
    muteCardAndButtonClickSound?: boolean;
    muteYourTurn?: boolean;
    muteChatSound?: boolean;
    muteOpponentFoundSound?: boolean;
}

export interface IPreferences {
    cardback?: string;
    sound?: ISoundPreferences
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
    updateUserPreferences: (preferences: IPreferences) => void;
    updateSwuStatsRefreshToken: (swuStatsRefreshToken: string | null) => void;
    updateModerationSeenStatus: (moderation: IModeration) => void;
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
        exp: number;
    }
}