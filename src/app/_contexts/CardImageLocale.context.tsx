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
import { CardImageLocale } from '@/app/_utils/s3Utils';
import { useUser } from '@/app/_contexts/User.context';
import {
    loadPreferencesFromLocalStorage,
    savePreferencesToLocalStorage,
} from '@/app/_utils/ServerAndLocalStorageUtils';

interface ICardImageLocaleContext {
    locale: CardImageLocale;
    setLocale: (locale: CardImageLocale) => void;
}

const CardImageLocaleContext = createContext<ICardImageLocaleContext | undefined>(undefined);

const readInitialLocale = (
    userLocale: CardImageLocale | undefined,
): CardImageLocale => {
    if (userLocale) {
        return userLocale;
    }
    if (typeof window === 'undefined') {
        return CardImageLocale.English;
    }
    return loadPreferencesFromLocalStorage().gameOptions?.cardLanguage ?? CardImageLocale.English;
};

export const CardImageLocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useUser();
    const userLocale = user?.preferences?.gameOptions?.cardLanguage;

    const [locale, setLocaleState] = useState<CardImageLocale>(() => readInitialLocale(userLocale));

    // Keep the in-memory locale in sync when the authenticated user's preferences change
    // (e.g. after saving in GameOptionsTab, or after login/logout switches who "the user" is).
    useEffect(() => {
        const next = readInitialLocale(userLocale);
        setLocaleState((prev) => (prev === next ? prev : next));
    }, [userLocale]);

    const setLocale = useCallback((next: CardImageLocale) => {
        setLocaleState(next);
        // For anonymous users, persist to localStorage immediately so a refresh restores it.
        // Authenticated users go through the server-side preferences flow and are re-synced
        // via the useEffect above when UserContext updates.
        if (typeof window !== 'undefined' && !user) {
            const current = loadPreferencesFromLocalStorage();
            savePreferencesToLocalStorage({
                ...current,
                gameOptions: {
                    ...current.gameOptions,
                    cardLanguage: next,
                },
            });
        }
    }, [user]);

    const contextValue = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

    return (
        <CardImageLocaleContext.Provider value={contextValue}>
            {children}
        </CardImageLocaleContext.Provider>
    );
};

export const useCardImageLocaleContext = (): ICardImageLocaleContext => {
    const ctx = useContext(CardImageLocaleContext);
    if (!ctx) {
        throw new Error('useCardImageLocaleContext must be used within a CardImageLocaleProvider');
    }
    return ctx;
};

export const useCardImageLocale = (): CardImageLocale => useCardImageLocaleContext().locale;
