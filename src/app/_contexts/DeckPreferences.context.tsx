'use client';

import React, {
    createContext,
    useContext,
    ReactNode,
    useState,
    useEffect,
} from 'react';
import { SwuGameFormat } from '@/app/_constants/constants';

interface IDeckPreferencesContextType {
    showSavedDecks: boolean;
    setShowSavedDecks: (value: boolean) => void;
    favoriteDeck: string;
    setFavoriteDeck: (value: string) => void;
    format: SwuGameFormat;
    setFormat: (value: SwuGameFormat) => void;
    deckLink: string;
    setDeckLink: (value: string) => void;
    clearErrors: () => void;
}

const DeckPreferencesContext = createContext<IDeckPreferencesContextType>({
    showSavedDecks: false,
    setShowSavedDecks: () => {},
    favoriteDeck: '',
    setFavoriteDeck: () => {},
    format: SwuGameFormat.Premier,
    setFormat: () => {},
    deckLink: '',
    setDeckLink: () => {},
    clearErrors: () => {},
});

export const DeckPreferencesProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    // Initialize from localStorage but don't sync back to it (as per requirements)
    const [showSavedDecks, setShowSavedDecks] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('useSavedDecks') === 'true';
        }
        return false;
    });

    const [favoriteDeck, setFavoriteDeck] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedDeck') || '';
        }
        return '';
    });

    const [format, setFormat] = useState<SwuGameFormat>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('format');
            return (stored as SwuGameFormat) || SwuGameFormat.Premier;
        }
        return SwuGameFormat.Premier;
    });

    const [deckLink, setDeckLink] = useState<string>('');

    // Sync changes back to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('useSavedDecks', showSavedDecks.toString());
        }
    }, [showSavedDecks]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('selectedDeck', favoriteDeck);
        }
    }, [favoriteDeck]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('format', format);
        }
    }, [format]);

    const clearErrors = () => {
        // Dispatch a custom event to notify forms to clear their error states
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('clearDeckErrors'));
        }
    };

    const value = {
        showSavedDecks,
        setShowSavedDecks,
        favoriteDeck,
        setFavoriteDeck,
        format,
        setFormat,
        deckLink,
        setDeckLink,
        clearErrors,
    };

    return (
        <DeckPreferencesContext.Provider value={value}>
            {children}
        </DeckPreferencesContext.Provider>
    );
};

export const useDeckPreferences = (): IDeckPreferencesContextType => {
    const context = useContext(DeckPreferencesContext);
    if (!context) {
        throw new Error('useDeckPreferences must be used within a DeckPreferencesProvider');
    }
    return context;
};