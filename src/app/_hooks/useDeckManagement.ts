import { useState, useEffect, useCallback } from 'react';
import { SwuGameFormat, GamesToWinMode, DefaultQueueFormatKey, QueueFormatOptions } from '@/app/_constants/constants';
import { StoredDeck, DisplayDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { 
    retrieveDecksForUser, 
    fetchSwuStatsDecks, 
    checkSwuStatsLinkStatus,
    ISwuStatsDeckItem 
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { useUser } from '@/app/_contexts/User.context';
import { useSession } from 'next-auth/react';

export interface IDeckPreferences {
    showSavedDecks: boolean;
    favoriteDeck: string;
    format: SwuGameFormat;
    gamesToWinMode: GamesToWinMode;
    saveDeck: boolean;
}

export interface IDeckPreferencesHandlers {
    setShowSavedDecks: (value: boolean) => void;
    setFavoriteDeck: (value: string) => void;
    setFormat: (value: SwuGameFormat) => void;
    setGamesToWinMode: (value: GamesToWinMode) => void;
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
    isBo3Allowed: boolean;
    // SWU Stats integration
    swuStatsDecks: ISwuStatsDeckItem[];
    isSwuStatsLinked: boolean;
    useSwuStatsDecks: boolean;
    toggleDeckSource: () => void;
    isLoadingSwuStatsDecks: boolean;
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

    const [gamesToWinMode, setGamesToWinMode] = useState<GamesToWinMode>(() => {
        const stored = localStorage.getItem('gamesToWinMode');

        if (stored !== GamesToWinMode.BestOfOne && stored !== GamesToWinMode.BestOfThree) {
            return GamesToWinMode.BestOfOne;
        }

        return (stored as GamesToWinMode) || GamesToWinMode.BestOfOne;
    });

    const [deckLink, setDeckLink] = useState<string>('');
    const [saveDeck, setSaveDeck] = useState<boolean>(false);
    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);

    // SWU Stats integration state
    const [swuStatsDecks, setSwuStatsDecks] = useState<ISwuStatsDeckItem[]>([]);
    const [isSwuStatsLinked, setIsSwuStatsLinked] = useState<boolean>(false);
    const [isLoadingSwuStatsDecks, setIsLoadingSwuStatsDecks] = useState<boolean>(false);
    
    // Toggle state for switching between SWU Stats and Karabast decks
    // When SWU Stats is linked, default to using SWU Stats decks
    const [useSwuStatsDecks, setUseSwuStatsDecks] = useState<boolean>(false);

    // When SWU Stats link status changes, update the toggle accordingly
    useEffect(() => {
        const stored = localStorage.getItem('useSwuStatsDecks');
        
        if (isSwuStatsLinked) {
            // If SWU Stats is linked, default to true unless explicitly set to false
            if (stored === null) {
                // First time linking - default to true
                setUseSwuStatsDecks(true);
                localStorage.setItem('useSwuStatsDecks', 'true');
            } else {
                // Use stored preference
                setUseSwuStatsDecks(stored === 'true');
            }
        } else {
            // If SWU Stats is not linked, must use Karabast
            setUseSwuStatsDecks(false);
        }
    }, [isSwuStatsLinked]);

    // Sync useSwuStatsDecks to localStorage when manually changed
    const syncUseSwuStatsDecksToStorage = useCallback((value: boolean) => {
        localStorage.setItem('useSwuStatsDecks', value.toString());
    }, []);

    // Bo3 is only allowed for logged-in users, but in dev mode we allow it unless explicitly blocked
    const isDev = process.env.NODE_ENV === 'development';
    const blockBo3AnonLocal = process.env.NEXT_PUBLIC_FORCE_BLOCK_BO3_ANON_LOCAL === 'true';
    const isBo3Allowed = (isDev && !blockBo3AnonLocal) || !!user;

    // Return effective gamesToWinMode: if Bo3 is not allowed, return Bo1 without modifying stored value
    // This preserves the user's preference during login race conditions
    const effectiveGamesToWinMode = (!isBo3Allowed && gamesToWinMode === GamesToWinMode.BestOfThree)
        ? GamesToWinMode.BestOfOne
        : gamesToWinMode;

    // Sync deck preferences to localStorage
    useEffect(() => {
        localStorage.setItem('format', format);
    }, [format]);

    useEffect(() => {
        localStorage.setItem('gamesToWinMode', gamesToWinMode);
    }, [gamesToWinMode]);

    // Check SWU Stats link status and fetch decks when user changes
    useEffect(() => {
        const checkAndFetchSwuStatsDecks = async () => {
            if (!user) {
                setIsSwuStatsLinked(false);
                setSwuStatsDecks([]);
                return;
            }

            // Mock SWU Stats data for dev user "ThisIsTheWay"
            if (process.env.NODE_ENV === 'development' && user.id === 'th3w4y') {
                console.log('[DEV] Using mock SWU Stats data for ThisIsTheWay');
                setIsSwuStatsLinked(true);
                setIsLoadingSwuStatsDecks(true);
                
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const mockSwuStatsDecks: ISwuStatsDeckItem[] = [
                    {
                        id: 1001,
                        name: 'Sabine Aggro',
                        description: 'Fast aggressive Sabine deck',
                        isFavorite: true,
                        createdAt: '2025-01-15 10:00:00',
                        updatedAt: '2025-01-20 14:30:00',
                        deckLink: 'https://swustats.net/TCGEngine/Decks/Deck.php?gameName=1001',
                    },
                    {
                        id: 1002,
                        name: 'Boba Control',
                        description: 'Bounty hunter control deck',
                        isFavorite: true,
                        createdAt: '2025-01-10 09:00:00',
                        updatedAt: '2025-01-18 11:00:00',
                        deckLink: 'https://swustats.net/TCGEngine/Decks/Deck.php?gameName=1002',
                    },
                    {
                        id: 1003,
                        name: 'Vader Ramp',
                        description: 'Big units Vader deck',
                        isFavorite: false,
                        createdAt: '2025-01-05 08:00:00',
                        updatedAt: '2025-01-12 16:00:00',
                        deckLink: 'https://swustats.net/TCGEngine/Decks/Deck.php?gameName=1003',
                    },
                    {
                        id: 1004,
                        name: 'Luke Skywalker Midrange',
                        description: 'Balanced Luke deck',
                        isFavorite: false,
                        createdAt: '2025-01-02 12:00:00',
                        updatedAt: '2025-01-08 09:30:00',
                        deckLink: 'https://swustats.net/TCGEngine/Decks/Deck.php?gameName=1004',
                    },
                    {
                        id: 1005,
                        name: 'Han Solo Smugglers',
                        description: 'Cunning smuggler synergy',
                        isFavorite: false,
                        createdAt: '2024-12-28 15:00:00',
                        updatedAt: '2025-01-03 10:00:00',
                        deckLink: 'https://swustats.net/TCGEngine/Decks/Deck.php?gameName=1005',
                    },
                ];
                
                setSwuStatsDecks(mockSwuStatsDecks);
                setIsLoadingSwuStatsDecks(false);
                return;
            }

            try {
                const linked = await checkSwuStatsLinkStatus(user);
                setIsSwuStatsLinked(linked);

                if (linked) {
                    setIsLoadingSwuStatsDecks(true);
                    const result = await fetchSwuStatsDecks(user, false);
                    if (result?.decks) {
                        setSwuStatsDecks(result.decks);
                    }
                    setIsLoadingSwuStatsDecks(false);
                } else {
                    setSwuStatsDecks([]);
                }
            } catch (error) {
                console.error('Error checking SWU Stats status:', error);
                setIsSwuStatsLinked(false);
                setSwuStatsDecks([]);
                setIsLoadingSwuStatsDecks(false);
            }
        };

        checkAndFetchSwuStatsDecks();
    }, [user]);

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

    const toggleDeckSource = useCallback(() => {
        if (!isSwuStatsLinked) return; // Can't toggle if SWU Stats is not linked
        
        const newValue = !useSwuStatsDecks;
        setUseSwuStatsDecks(newValue);
        syncUseSwuStatsDecksToStorage(newValue);
        
        // Clear the selected deck when switching sources
        setFavoriteDeck('');
        localStorage.setItem('selectedDeck', '');
    }, [isSwuStatsLinked, useSwuStatsDecks, syncUseSwuStatsDecksToStorage]);

    const deckPreferences: IDeckPreferences = {
        showSavedDecks,
        favoriteDeck,
        format,
        gamesToWinMode: effectiveGamesToWinMode,
        saveDeck,
    };

    const deckPreferencesHandlers: IDeckPreferencesHandlers = {
        setShowSavedDecks: handleShowSavedDecksChange,
        setFavoriteDeck: handleFavoriteDeckChange,
        setFormat: useCallback((value: SwuGameFormat) => setFormat(value), []),
        setGamesToWinMode: useCallback((value: GamesToWinMode) => setGamesToWinMode(value), []),
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
        isBo3Allowed,
        // SWU Stats integration
        swuStatsDecks,
        isSwuStatsLinked,
        useSwuStatsDecks,
        toggleDeckSource,
        isLoadingSwuStatsDecks,
    };
};