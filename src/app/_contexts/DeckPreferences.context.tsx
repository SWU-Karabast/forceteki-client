'use client';

import React, {
    createContext,
    useContext,
    ReactNode,
    useState,
    useEffect,
} from 'react';

interface IDeckPreferencesContextType {
    showSavedDecks: boolean;
    setShowSavedDecks: (value: boolean) => void;
    favoriteDeck: string;
    setFavoriteDeck: (value: string) => void;
    format: string;
    setFormat: (value: string) => void;
    deckLink: string;
    setDeckLink: (value: string) => void;
    clearErrors: () => void;
}

const DeckPreferencesContext = createContext<IDeckPreferencesContextType>({
    showSavedDecks: false,
    setShowSavedDecks: () => {},
    favoriteDeck: '',
    setFavoriteDeck: () => {},
    format: 'Premier',
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

    const [format, setFormat] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('format') || 'Premier';
        }
        return 'Premier';
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