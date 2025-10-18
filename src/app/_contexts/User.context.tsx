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
import { IUserContextType, IPreferences, IModerationAction } from './UserTypes';
import { v4 as uuid } from 'uuid';
import { getUserFromServer } from '@/app/_utils/ServerAndLocalStorageUtils';

const UserContext = createContext<IUserContextType>({
    user: null,
    anonymousUserId: null,
    isLoading: true,
    login: () => {},
    devLogin: () => {},
    logout: () => {},
    updateUsername: () => {},
    updateWelcomeMessage: () => {},
    updateNeedsUsernameChange: () => {},
    updateUserPreferences: () => {},
    updateSwuStatsRefreshToken: () => {},
    updateModerationSeenStatus: () => {},
    updateUndoPopupSeenDate: () => {}
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const { data: session, update, status } = useSession(); // Get session from next-auth
    const [user, setUser] = useState<IUserContextType['user']>(null);
    const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const hideLogin = process.env.NEXT_PUBLIC_HIDE_LOGIN === 'HIDE';

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
            let needsLogout = false;
            if (session?.user) {
                try {
                    const serverUser = await getUserFromServer();
                    setUser({
                        id: serverUser.id,
                        username: serverUser.username,
                        email: session.user.email,
                        provider: session.user.provider,
                        providerId: session.user.id,
                        showWelcomeMessage: serverUser.showWelcomeMessage,
                        authenticated: true,
                        preferences: serverUser.preferences,
                        needsUsernameChange: serverUser.needsUsernameChange,
                        swuStatsRefreshToken: serverUser.swuStatsRefreshToken,
                        moderation: serverUser.moderation,
                        undoPopupSeenDate: serverUser.undoPopupSeenDate,
                    });
                    update({ userId: serverUser.id });
                } catch (error) {
                    // Just flag the error, handle anonymous user setting separately
                    console.error('Error syncing user with server:', error);
                    // we need to logout the user when an error with getting the user happens
                    needsLogout = true;
                }
            }
            if(needsLogout){
                logout();
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
        if(hideLogin && (session?.user || storedUser)){
            logout();
        }
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
                needsUsernameChange: false,
                showWelcomeMessage: false,
                id: 'exe66',
                username: 'Order66',
                authenticated: true,
                preferences: { },
            });
        } else if (user === 'ThisIsTheWay') {
            setUser({
                needsUsernameChange: false,
                showWelcomeMessage: false,
                id: 'th3w4y',
                username: 'ThisIsTheWay',
                authenticated: true,
                preferences: { },
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

    const updateWelcomeMessage = () => {
        setUser((prevUser) => {
            if(!prevUser) return null;
            return {
                ...prevUser,
                showWelcomeMessage: false
            }
        })
    }

    const updateUndoPopupSeenDate = () => {
        setUser((prevUser) => {
            if(!prevUser) return null;
            return {
                ...prevUser,
                undoPopupSeenDate: new Date()
            }
        })
    }

    const updateNeedsUsernameChange = () => {
        setUser((prevUser) => {
            if(!prevUser) return null;
            return {
                ...prevUser,
                needsUsernameChange: false
            }
        })
    }

    const updateModerationSeenStatus = (moderation: IModerationAction | null) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                moderation
            };
        });
    };


    const updateUserPreferences = (newPreferences: IPreferences) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                preferences: newPreferences
            };
        });
    };

    const updateSwuStatsRefreshToken = (swuStatsRefreshToken: string | null) => {
        setUser((prevUser) => {
            if (!prevUser) return null;
            return {
                ...prevUser,
                swuStatsRefreshToken
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
        <UserContext.Provider value={{ 
            user,
            anonymousUserId,
            isLoading: status === 'loading' || (status === 'authenticated' && user == null),
            login,
            devLogin,
            logout,
            updateUsername,
            updateWelcomeMessage,
            updateUndoPopupSeenDate,
            updateNeedsUsernameChange,
            updateUserPreferences,
            updateSwuStatsRefreshToken,
            updateModerationSeenStatus
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    return useContext(UserContext);
};
