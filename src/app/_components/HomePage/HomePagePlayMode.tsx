import React, { useEffect, useState, useCallback } from 'react';
import { Typography, Box, Tab, Tabs, Card, CardContent, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import CreateGameForm from '../_sharedcomponents/CreateGameForm/CreateGameForm';
import { useUser } from '@/app/_contexts/User.context';
import QuickGameForm from '@/app/_components/_sharedcomponents/QuickGameForm/QuickGameForm';
import WelcomePopup from '@/app/_components/_sharedcomponents/HomescreenWelcome/WelcomePopup';
import UpdatePopup from '@/app/_components/_sharedcomponents/HomescreenWelcome/UpdatePopup';
import UsernameChangeRequiredPopup
    from '@/app/_components/_sharedcomponents/HomescreenWelcome/moderationPopups/UsernameChangeRequiredPopup';
import UserMutedPopup from '@/app/_components/_sharedcomponents/HomescreenWelcome/moderationPopups/UserMutedPopup';
import { 
    setModerationSeenAsync, 
    retrieveDecksForUser, 
    hasUserSeenUndoPopup, 
    markUndoPopupAsSeen 
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { checkIfModerationExpired } from '@/app/_utils/ModerationUtils';
import { SwuGameFormat } from '@/app/_constants/constants';
import { StoredDeck, DisplayDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { useSession } from 'next-auth/react';
import { markAnnouncementAsSeen, shouldShowAnnouncement } from '@/app/_utils/ServerAndLocalStorageUtils';
import NewFeaturePopup from '../_sharedcomponents/HomescreenWelcome/NewFeaturePopup';
import { announcement } from '@/app/_constants/mockData';
import UndoTutorialPopup from '@/app/_components/_sharedcomponents/HomePagePlayMode/UndoTutorialPopup';

const HomePagePlayMode: React.FC = () => {
    const router = useRouter();
    const [value, setValue] = React.useState(0);
    const [testGameList, setTestGameList] = React.useState([]);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);
    const [showUpdatePopup, setShowUpdatePopup] = useState(false);
    const [showNewFeaturePopup, setShowNewFeaturePopup] = useState(false);
    const [showUsernameMustChangePopup, setUsernameMustChangePopup] = useState<boolean>(false);
    const [showMutedPopup, setShowMutedPopup] = useState<boolean>(false);
    const [showUndoTutorialPopup, setShowUndoTutorialPopup] = useState<boolean>(false);
    const [pendingFormSubmission, setPendingFormSubmission] = useState<(() => void) | null>(null);
    const [moderationDays, setModerationDays] = useState<number | undefined>(undefined);
    const { user, isLoading: userLoading, updateWelcomeMessage, updateModerationSeenStatus, updateUndoPopupSeenDate } = useUser();
    const { data: session } = useSession();

    // Deck Preferences State (moved from context)
    const [showSavedDecks, setShowSavedDecks] = useState<boolean>(() => {
        return localStorage.getItem('useSavedDecks') === 'true';
    });

    const [favoriteDeck, setFavoriteDeck] = useState<string>(() => {
        return localStorage.getItem('selectedDeck') || '';
    });

    const [format, setFormat] = useState<SwuGameFormat>(() => {
        const stored = localStorage.getItem('format');
        return (stored as SwuGameFormat) || SwuGameFormat.Premier;
    });

    const [deckLink, setDeckLink] = useState<string>('');
    const [isJsonDeck, setIsJsonDeck] = useState<boolean>(false)
    const [saveDeck, setSaveDeck] = useState<boolean>(false);

    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);

    // Sync deck preferences to localStorage
    useEffect(() => {
        localStorage.setItem('format', format);
    }, [format]);

    const handleInitializeDeckSelection = useCallback((firstDeck: string, allDecks: StoredDeck[] | DisplayDeck[]) => {
        let selectDeck = localStorage.getItem('selectedDeck');

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

    const fetchDecks = useCallback(async() => {
        if (userLoading) {
            return;
        }

        try {
            await retrieveDecksForUser(session?.user, user, { setDecks: setSavedDecks, setFirstDeck: handleInitializeDeckSelection });
        }catch {
            alert('Server error when fetching decks');
        }
    }, [session?.user, user, userLoading, handleInitializeDeckSelection]);

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

    const handleDeckManagement = useCallback(() => {
        router.push('/DeckPage');
    }, [router]);

    // Clear form errors function
    const clearErrors = useCallback(() => {
        window.dispatchEvent(new CustomEvent('clearDeckErrors'));
    }, []);

    const closeWelcomePopup = () => {
        setShowWelcomePopup(false);
        setShowUpdatePopup(true);
    };

    const closeUpdatePopup = () => {
        setShowUpdatePopup(false);
        updateWelcomeMessage();
    }

    const closeNewFeaturePopup = () => {
        setShowNewFeaturePopup(false);
        markAnnouncementAsSeen(announcement)
    }

    const showTestGames = process.env.NODE_ENV === 'development' && (user?.id === 'exe66' || user?.id === 'th3w4y');
    const showQuickMatch = process.env.NEXT_PUBLIC_DISABLE_LOCAL_QUICK_MATCH !== 'true';

    // Create deck preferences object for forms
    const deckPreferences = {
        showSavedDecks,
        favoriteDeck,
        format,
        saveDeck,
    };

    const handleShowSavedDecksChange = useCallback((value: boolean) => {
        setShowSavedDecks(value);
        localStorage.setItem('useSavedDecks', value.toString());
    }, []);

    const handleFavoriteDeckChange = useCallback((value: string) => {
        setFavoriteDeck(value);
        localStorage.setItem('selectedDeck', value);
    }, []);

    const deckPreferencesHandlers = {
        setShowSavedDecks: handleShowSavedDecksChange,
        setFavoriteDeck: handleFavoriteDeckChange,
        setFormat: useCallback((value: SwuGameFormat) => setFormat(value), []),
        setSaveDeck: useCallback((value: boolean) => setSaveDeck(value), []),
    };

    const handleSetDeckLink = useCallback((value: string) => setDeckLink(value), []);

    // Undo Tutorial Popup handlers
    const handleFormSubmissionWithUndoCheck = useCallback((originalSubmissionFn: () => void) => {
        // Check if user has seen the undo popup (works for both signed-in and anonymous users)
        if (!hasUserSeenUndoPopup(user) && (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_SHOW_LOCAL_ANNOUNCEMENTS === 'true')) {
            // User hasn't seen the popup, show it and store the submission function
            setPendingFormSubmission(() => originalSubmissionFn);
            setShowUndoTutorialPopup(true);
        } else {
            // User has seen the popup, proceed with normal submission
            originalSubmissionFn();
        }
    }, [user]);

    const handleUndoTutorialClose = useCallback(async () => {
        setShowUndoTutorialPopup(false);
        
        // Mark the popup as seen (handles both signed-in and anonymous users)
        try {
            await markUndoPopupAsSeen(user, updateUndoPopupSeenDate);
        } catch (error) {
            console.error('Failed to mark undo popup as seen:', error);
        }

        // Execute the pending form submission
        if (pendingFormSubmission) {
            pendingFormSubmission();
            setPendingFormSubmission(null);
        }
    }, [user, pendingFormSubmission, updateUndoPopupSeenDate]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
        // Clear error messages when switching tabs
        clearErrors();
    }

    const handleCloseMutedPopup = async() => {
        setShowMutedPopup(false);
        const updatedModeration = { ...user?.moderation, hasSeen: true };
        updateModerationSeenStatus(updatedModeration)
        try {
            await setModerationSeenAsync(user);
        }catch(error){
            console.log(error)
        }
    };

    const handleStartTestGame = async (filename: string) => {
        try {
            // const payload = {
            // 	user: user,
            // 	deck: deckData
            // };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/start-test-game`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ filename: filename }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to start test game');
            }

            router.push('/GameBoard');
        } catch (error) {
            console.error(error);
        }
    }

    useEffect(() => {
        if(user) {
            if (user.showWelcomeMessage && !showUpdatePopup) {
                setShowMutedPopup(false);
                setShowNewFeaturePopup(false);
                setShowWelcomePopup(true);
            }
            setUsernameMustChangePopup(!!user.needsUsernameChange);
            if(user.moderation){
                setModerationDays(user.moderation.daysRemaining);
                if(!user.moderation.hasSeen && (!user.showWelcomeMessage && !user.needsUsernameChange)) {
                    setShowNewFeaturePopup(false);
                    setShowMutedPopup(true);
                }
                // check if moderation object still exists
                checkIfModerationExpired(user.moderation, updateModerationSeenStatus);
            } else {
                setShowMutedPopup(false);
            }
        }
        if (shouldShowAnnouncement(announcement) && (!user || (!user.showWelcomeMessage && (!user.moderation || (user.moderation.hasSeen))))) {
            setShowNewFeaturePopup(true);
        }


        if (process.env.NODE_ENV !== 'development') return;
        const fetchGameList = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/test-game-setups`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    }
                );
    
                if (!response.ok) {
                    throw new Error('Failed to get test game list');
                }
    
                const data = await response.json();
                setTestGameList(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchGameList();
    }, [user, showUpdatePopup,showMutedPopup, updateModerationSeenStatus]);

    const styles = {
        wrapper: {
            height: '100%',
        },
        tabStyles: {
            color: 'white',
            fontWeight: 'bold',
            typography: 'h3',
        }
    };

    return (
        <>
            <Card variant="black" sx={styles.wrapper}>
                { process.env.NEXT_PUBLIC_DISABLE_CREATE_GAMES === 'true' ?
                    <CardContent>
                        <Typography variant="h2">MAINTENANCE</Typography>
                        <Typography variant="h3" sx={{ mb: 1 }}>Karabast is currently under maintenance.</Typography>
                        <Typography variant="h3">Be back soon!</Typography>
                    </CardContent>
                    :
                    <CardContent>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: '1rem' }}>
                            <Tabs value={value} variant="fullWidth" onChange={handleChange}>
                                {showQuickMatch && <Tab sx={styles.tabStyles} label="Quick Match" />}
                                <Tab sx={styles.tabStyles} label="Create Lobby" />
                                {showTestGames && <Tab sx={styles.tabStyles} label="Test" />}
                            </Tabs>
                        </Box>
                        {showQuickMatch && 
                        <TabPanel index={0} value={value}>
                            <QuickGameForm
                                deckPreferences={deckPreferences}
                                deckPreferencesHandlers={deckPreferencesHandlers}
                                deckLink={deckLink}
                                setDeckLink={handleSetDeckLink}
                                savedDecks={savedDecks}
                                handleDeckManagement={handleDeckManagement}
                                handleFormSubmissionWithUndoCheck={handleFormSubmissionWithUndoCheck}
                                setIsJsonDeck={setIsJsonDeck}
                                isJsonDeck={isJsonDeck}
                            />
                        </TabPanel>}
                        <TabPanel index={showQuickMatch ? 1 : 0} value={value}>
                            <CreateGameForm
                                deckPreferences={deckPreferences}
                                deckPreferencesHandlers={deckPreferencesHandlers}
                                deckLink={deckLink}
                                setDeckLink={handleSetDeckLink}
                                savedDecks={savedDecks}
                                handleDeckManagement={handleDeckManagement}
                                handleFormSubmissionWithUndoCheck={handleFormSubmissionWithUndoCheck}
                                setIsJsonDeck={setIsJsonDeck}
                                isJsonDeck={isJsonDeck}
                            />
                        </TabPanel>
                        {showTestGames &&
                        <TabPanel index={showQuickMatch ? 2 : 1} value={value}>
                            <Box>
                                <Typography variant="h2">Test Game Setups</Typography>
                                {testGameList.map((filename, index) => {
                                    return (
                                        <Box key={index}>
                                            <Button sx={{ marginBottom: 2 }} key={index} onClick={() => handleStartTestGame(filename)}>
                                                {filename}
                                            </Button>
                                        </Box>
                                    );
                                })}
                                <Button onClick={() => router.push('/GameBoard')}>Join Test Game</Button>
                            </Box>
                        </TabPanel>
                        }
                    </CardContent>
                }
            </Card>
            <WelcomePopup open={showWelcomePopup} onClose={closeWelcomePopup} />
            <UpdatePopup open={showUpdatePopup} onClose={closeUpdatePopup} />
            <NewFeaturePopup open={showNewFeaturePopup} onClose={closeNewFeaturePopup} />
            <UsernameChangeRequiredPopup open={showUsernameMustChangePopup}/>
            <UserMutedPopup durationDays={moderationDays!} open={showMutedPopup} onClose={handleCloseMutedPopup}></UserMutedPopup>
            <UndoTutorialPopup open={showUndoTutorialPopup} onClose={handleUndoTutorialClose} />
        </>
    );
};

interface ITabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const TabPanel: React.FC<ITabPanelProps> = (props) => {
    const { children, value, index } = props;

    return (
        <Box
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
        >
            {children}
        </Box>
    );
};

export default HomePagePlayMode;
