export interface IUser extends IGetUser{
    email?: string;
    provider?: string;
    providerId?: string;
    authenticated: boolean,
}

export enum ChatDisabledReason {
    None = 'none',
    NotLoggedIn = 'notLoggedIn',
    AnonymousOpponent = 'anonymousOpponent',
    UserMuted = 'userMuted',
    OpponentDisabledChat = 'opponentDisabledChat'
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
    daysRemaining?: number;
    endDate?: Date;
    hasSeen?: boolean;
    moderationType?: ModerationType
}

export interface IGetUser {
    id: string;
    username: string;
    showWelcomeMessage: boolean;
    preferences: IPreferences,
    needsUsernameChange: boolean;
    moderation?: IModerationAction | null,
    undoPopupSeenDate?: Date | null
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
    background?: string;
    playmat?: string;
    sound?: ISoundPreferences
}

export interface IUserContextType {
    user: IUser | null;
    anonymousUserId: string | null;
    isLoading: boolean;
    login: (provider: 'google' | 'discord') => void;
    devLogin: (user: 'Order66' | 'ThisIsTheWay') => void;
    logout: () => void;
    updateUsername: (username: string) => void;
    updateWelcomeMessage: () => void;
    updateNeedsUsernameChange: () => void;
    updateUserPreferences: (preferences: IPreferences) => void;
    updateModerationSeenStatus: (moderation: IModerationAction | null) => void;
    updateUndoPopupSeenDate: () => void;
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
            id?: string;
            name?: string;
            email?: string;
            image?: string;
            provider: string;
            userId?: string;
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