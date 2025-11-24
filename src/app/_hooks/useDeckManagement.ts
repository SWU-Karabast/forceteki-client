import { useState, useEffect, useCallback } from 'react';
import { SwuGameFormat } from '@/app/_constants/constants';
import { StoredDeck, DisplayDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { retrieveDecksForUser } from '@/app/_utils/ServerAndLocalStorageUtils';
import { useUser } from '@/app/_contexts/User.context';
import { useSession } from 'next-auth/react';

export interface IDeckPreferences {
    showSavedDecks: boolean;
    favoriteDeck: string;
    format: SwuGameFormat;
    saveDeck: boolean;
}

export interface IDeckPreferencesHandlers {
    setShowSavedDecks: (value: boolean) => void;
    setFavoriteDeck: (value: string) => void;
    setFormat: (value: SwuGameFormat) => void;
    setSaveDeck: (value: boolean) => void;
}

export interface IDeckManagementState {
    deckPreferences: IDeckPreferences;
    deckPreferencesHandlers: IDeckPreferencesHandlers;
    deckLink: string;
    setDeckLink: (value: string) => void;
    savedDecks: StoredDeck[];
    setSavedDecks: (decks: StoredDeck[]) => void;
    fetchDecks: () => Promise<void>;
}

export const useDeckManagement = (): IDeckManagementState => {
    const { user } = useUser();
    const { data: session } = useSession();
    
    // Deck Preferences State
    const [showSavedDecks, setShowSavedDecks] = useState<boolean>(() => {
        return localStorage.getItem('useSavedDecks') === 'true';
    });

    const [favoriteDeck, setFavoriteDeck] = useState<string>(() => {
        return localStorage.getItem('selectedDeck') || '';
    });

    const [format, setFormat] = useState<SwuGameFormat>(() => {
        const stored = localStorage.getItem('format');

        if (stored !== SwuGameFormat.Premier && stored !== SwuGameFormat.Open) {
            return SwuGameFormat.Premier;
        }

        return (stored as SwuGameFormat) || SwuGameFormat.Premier;
    });

    const [deckLink, setDeckLink] = useState<string>('');
    const [saveDeck, setSaveDeck] = useState<boolean>(false);
    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);

    // Sync deck preferences to localStorage
    useEffect(() => {
        localStorage.setItem('format', format);
    }, [format]);

    const handleInitializeDeckSelection = useCallback((firstDeck: string, allDecks: StoredDeck[] | DisplayDeck[]) => {
        let selectDeck = localStorage.getItem('selectedDeck') || '';

        if (selectDeck && !allDecks.some(deck => deck.deckID === selectDeck)) {
            selectDeck = '';
        }

        if (!selectDeck) {
            selectDeck = firstDeck || '';
        }

        if (selectDeck !== favoriteDeck) {
            setFavoriteDeck(selectDeck);
        }

        if (localStorage.getItem('useSavedDecks') == null) {
            setShowSavedDecks(true);
        }
    }, [favoriteDeck]);

    const fetchDecks = useCallback(async () => {
        try {
            await retrieveDecksForUser(session?.user, user, { 
                setDecks: setSavedDecks, 
                setFirstDeck: handleInitializeDeckSelection 
            });
        } catch (error) {
            console.error('Error fetching decks:', error);
            alert('Server error when fetching decks');
        }
    }, [session?.user, user, handleInitializeDeckSelection]);

    const handleShowSavedDecksChange = useCallback((value: boolean) => {
        setShowSavedDecks(value);
        localStorage.setItem('useSavedDecks', value.toString());
    }, []);

    const handleFavoriteDeckChange = useCallback((value: string) => {
        setFavoriteDeck(value);
        localStorage.setItem('selectedDeck', value);
    }, []);

    const handleSetDeckLink = useCallback((value: string) => setDeckLink(value), []);

    const deckPreferences: IDeckPreferences = {
        showSavedDecks,
        favoriteDeck,
        format,
        saveDeck,
    };

    const deckPreferencesHandlers: IDeckPreferencesHandlers = {
        setShowSavedDecks: handleShowSavedDecksChange,
        setFavoriteDeck: handleFavoriteDeckChange,
        setFormat: useCallback((value: SwuGameFormat) => setFormat(value), []),
        setSaveDeck: useCallback((value: boolean) => setSaveDeck(value), []),
    };

    return {
        deckPreferences,
        deckPreferencesHandlers,
        deckLink,
        setDeckLink: handleSetDeckLink,
        savedDecks,
        setSavedDecks,
        fetchDecks,
    };
};