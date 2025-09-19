export interface IUser extends IGetUser{
    email: string | null;
    provider: string | null;
    providerId: string | null;
    authenticated: boolean,
}

export enum ChatDisabledReason {
    NONE = 'none',
    NOT_LOGGED_IN = 'not_logged_in',
    ANONYMOUS_OPPONENT = 'anonymous_opponent',
    USER_MUTED = 'user_muted',
    OPPONENT_DISABLED_CHAT = 'opponent_disabled_chat'
}

export interface IChatDisabledInfo {
    reason: ChatDisabledReason;
    message: string;
    borderColor: string;
}

export enum ModerationType {
    Mute = 'Mute',
    Ban = 'Ban',
}
export interface IModerationAction {
    days?: number;
    endDate?: Date | undefined;
    hasSeen?: boolean;
    moderationType?: ModerationType
}

export interface IGetUser {
    id: string;
    username: string;
    showWelcomeMessage: boolean;
    preferences: IPreferences,
    needsUsernameChange: boolean;
    swuStatsRefreshToken?: string | null,
    moderation?: IModerationAction
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
    updateModerationSeenStatus: (moderation: IModerationAction) => void;
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