export interface IUser {
    id: string | null;
    username: string | null;
    email: string | null;
    provider: string | null;
}

export interface IUserContextType {
    user: IUser | null;
    anonymousUserId: string | null;
    login: (provider: 'google' | 'discord') => void;
    devLogin: (user: 'Order66' | 'ThisIsTheWay') => void;
    logout: () => void;
}
