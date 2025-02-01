'use client';

import React, {
    createContext,
    useContext,
    ReactNode,
    useEffect,
    useState,
} from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { IUserContextType } from './UserTypes';
import { v4 as uuid } from 'uuid';

const UserContext = createContext<IUserContextType>({
    user: null,
    anonymousUserId: null,
    login: () => {},
    devLogin: () => {},
    logout: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { data: session } = useSession(); // Get session from next-auth
    const [user, setUser] = useState<IUserContextType['user']>(null);
    const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // check dev user first
        if (process.env.NODE_ENV === 'development') {
            const storedUser = localStorage.getItem('devUser');
            if (storedUser === 'Order66' || storedUser === 'ThisIsTheWay') {
                handleDevSetUser(storedUser);
            }
        }
    
        // Keep context in sync with next-auth session
        if (session?.user) {
            setUser({
                id: session.user.id || null,
                username: session.user.name || null,
                email: session.user.email || null,
                provider: session.user.provider || null,
            });
        } else {
            // if session not detected assign anonymous user
            let anonymousId = sessionStorage.getItem('anonymousUserId');
            if (!anonymousId) {
                anonymousId = uuid();
                sessionStorage.setItem('anonymousUserId', anonymousId);
            }
            setAnonymousUserId(anonymousId);
        }
    }, [session]);


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
            });
        } else if (user === 'ThisIsTheWay') {
            setUser({
                id: 'th3w4y',
                username: 'ThisIsTheWay',
                email: null,
                provider: null,
            });
        }
    }

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
        sessionStorage.removeItem('anonymousUserId');
        setAnonymousUserId(null);
    }

    return (
        <UserContext.Provider value={{ user, anonymousUserId, login, devLogin, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
