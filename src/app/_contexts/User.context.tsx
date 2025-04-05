'use client';

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useState,
} from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { IUserContextType } from './UserTypes';
import { v4 as uuid } from 'uuid';
import { getUserFromServer } from '@/app/_utils/DeckStorageUtils';

const UserContext = createContext<IUserContextType>({
    user: null,
    anonymousUserId: null,
    login: () => {},
    devLogin: () => {},
    logout: () => {},
    updateUsername: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { data: session } = useSession(); // Get session from next-auth
    const [user, setUser] = useState<IUserContextType['user']>(null);
    const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // check dev user first
        const storedUser = localStorage.getItem('devUser');
        if (process.env.NODE_ENV === 'development') {
            if (storedUser === 'Order66' || storedUser === 'ThisIsTheWay') {
                handleDevSetUser(storedUser);
            }
        }
        const syncUserWithServer = async () => {
            // If user is already logged in with the current session, do nothing
            if (session?.user && user?.providerId === session.user.id) {
                return;
            }
            // If user is logged in with session but needs to sync with server
            if (session?.user) {
                try {
                    const serverUser = await getUserFromServer();
                    setUser({
                        id: serverUser.id,
                        username: serverUser.username,
                        email: session.user.email || null,
                        provider: session.user.provider || null,
                        providerId: session.user.id || null,
                    });
                } catch (error) {
                    console.error('Error syncing user with server:', error);
                    // Just flag the error, handle anonymous user setting separately
                }
            }
        };

        // Handle setting anonymous user if needed
        const setupAnonymousUserIfNeeded = (storedUser: string | null) => {
            // Only set anonymous user if no session exists
            if (!session?.user && !storedUser) {
                let anonymousId = localStorage.getItem('anonymousUserId');
                if (!anonymousId) {
                    anonymousId = uuid();
                    localStorage.setItem('anonymousUserId', anonymousId);
                }
                setAnonymousUserId(prevId => (prevId === anonymousId ? prevId : anonymousId));
            }
        };

        // to prevent race conditions
        const initializeUser = async (storedUser: string | null) => {
            await syncUserWithServer();
            setupAnonymousUserIfNeeded(storedUser);
        };

        initializeUser(storedUser);
    }, [session, pathname]);

    const login = (provider: 'google' | 'discord') => {
        signIn(provider, {
            callbackUrl: '/',
        });
        clearAnonUser();
    };

    const handleDevSetUser = (user: 'Order66' | 'ThisIsTheWay') => {
        if (user === 'Order66') {
            setUser({
                id: 'exe66',
                username: 'Order66',
                email: null,
                provider: null,
                providerId: null,
            });
        } else if (user === 'ThisIsTheWay') {
            setUser({
                id: 'th3w4y',
                username: 'ThisIsTheWay',
                email: null,
                provider: null,
                providerId: null,
            });
        }
    }

    const updateUsername = (newUsername: string) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                username: newUsername,
            };
        });
    };

    const devLogin = (user: 'Order66' | 'ThisIsTheWay') => {
        handleDevSetUser(user);
        clearAnonUser();
        localStorage.setItem('devUser', user);
        router.push('/');
    };
	

    const logout = () => {
        signOut({ callbackUrl: '/' });
        localStorage.removeItem('devUser');
        setUser(null);
    };

    const clearAnonUser = () => {
        localStorage.removeItem('anonymousUserId');
        setAnonymousUserId(null);
    }

    return (
        <UserContext.Provider value={{ user, anonymousUserId, login, devLogin, logout, updateUsername }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
