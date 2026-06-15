'use client';

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { TimerVisibility } from '@/app/_contexts/UserTypes';
import { useUser } from '@/app/_contexts/User.context';
import {
    loadPreferencesFromLocalStorage,
    savePreferencesToLocalStorage,
} from '@/app/_utils/ServerAndLocalStorageUtils';

export const DEFAULT_TIMER_VISIBILITY: TimerVisibility = TimerVisibility.Standard;

interface ITimerVisibilityContext {
    timerVisibility: TimerVisibility;
    setTimerVisibility: (visibility: TimerVisibility) => void;
}

const TimerVisibilityContext = createContext<ITimerVisibilityContext | undefined>(undefined);

const readInitialVisibility = (
    userVisibility: TimerVisibility | undefined,
): TimerVisibility => {
    if (userVisibility) {
        return userVisibility;
    }
    if (typeof window === 'undefined') {
        return DEFAULT_TIMER_VISIBILITY;
    }
    return loadPreferencesFromLocalStorage().gameOptions?.timerVisibility ?? DEFAULT_TIMER_VISIBILITY;
};

export const TimerVisibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const userVisibility = user?.preferences?.gameOptions?.timerVisibility;

    const [timerVisibility, setVisibilityState] = useState<TimerVisibility>(() => readInitialVisibility(userVisibility));

    // Keep the in-memory value in sync when the authenticated user's preferences change
    // (e.g. after saving in GameOptionsTab, or after login/logout).
    useEffect(() => {
        const next = readInitialVisibility(userVisibility);
        setVisibilityState((prev) => (prev === next ? prev : next));
    }, [userVisibility]);

    const setTimerVisibility = useCallback((next: TimerVisibility) => {
        setVisibilityState(next);
        // For anonymous users, persist to localStorage immediately so a refresh restores it.
        // Authenticated users go through the server-side preferences flow and are re-synced
        // via the useEffect above when UserContext updates.
        if (typeof window !== 'undefined' && !user) {
            const current = loadPreferencesFromLocalStorage();
            savePreferencesToLocalStorage({
                ...current,
                gameOptions: {
                    ...current.gameOptions,
                    timerVisibility: next,
                },
            });
        }
    }, [user]);

    const contextValue = useMemo(() => ({ timerVisibility, setTimerVisibility }), [timerVisibility, setTimerVisibility]);

    return (
        <TimerVisibilityContext.Provider value={contextValue}>
            {children}
        </TimerVisibilityContext.Provider>
    );
};

export const useTimerVisibilityContext = (): ITimerVisibilityContext => {
    const ctx = useContext(TimerVisibilityContext);
    if (!ctx) {
        throw new Error('useTimerVisibilityContext must be used within a TimerVisibilityProvider');
    }
    return ctx;
};
