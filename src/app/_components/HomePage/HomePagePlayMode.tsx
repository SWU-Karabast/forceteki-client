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
import { setModerationSeenAsync } from '@/app/_utils/ServerAndLocalStorageUtils';
import { checkIfModerationExpired } from '@/app/_utils/ModerationUtils';
import { SwuGameFormat } from '@/app/_constants/constants';

const HomePagePlayMode: React.FC = () => {
    const router = useRouter();
    const [value, setValue] = React.useState(0);
    const [testGameList, setTestGameList] = React.useState([]);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);
    const [showUpdatePopup, setShowUpdatePopup] = useState(false);
    const [showUsernameMustChangePopup, setUsernameMustChangePopup] = useState<boolean>(false);
    const [showMutedPopup, setShowMutedPopup] = useState<boolean>(false);
    const [moderationDays, setModerationDays] = useState<number | undefined>(undefined);
    const { user, updateWelcomeMessage, updateModerationSeenStatus } = useUser();

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

    const [saveDeck, setSaveDeck] = useState<boolean>(() => {
        return localStorage.getItem('saveDeck') === 'true';
    });

    // Sync deck preferences to localStorage
    useEffect(() => {
        localStorage.setItem('useSavedDecks', showSavedDecks.toString());
    }, [showSavedDecks]);

    useEffect(() => {
        localStorage.setItem('selectedDeck', favoriteDeck);
    }, [favoriteDeck]);

    useEffect(() => {
        localStorage.setItem('format', format);
    }, [format]);

    useEffect(() => {
        localStorage.setItem('saveDeck', saveDeck.toString());
    }, [saveDeck]);

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

    const showTestGames = process.env.NODE_ENV === 'development' && (user?.id === 'exe66' || user?.id === 'th3w4y');
    const showQuickMatch = process.env.NEXT_PUBLIC_DISABLE_LOCAL_QUICK_MATCH !== 'true';

    // Create deck preferences object for forms
    const deckPreferences = {
        showSavedDecks,
        favoriteDeck,
        format,
        saveDeck,
    };

    const deckPreferencesHandlers = {
        setShowSavedDecks: useCallback((value: boolean) => setShowSavedDecks(value), []),
        setFavoriteDeck: useCallback((value: string) => setFavoriteDeck(value), []),
        setFormat: useCallback((value: SwuGameFormat) => setFormat(value), []),
        setSaveDeck: useCallback((value: boolean) => setSaveDeck(value), []),
    };

    const handleSetDeckLink = useCallback((value: string) => setDeckLink(value), []);

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
                setShowWelcomePopup(true);
            }
            setUsernameMustChangePopup(!!user.needsUsernameChange);
            if(user.moderation){
                setModerationDays(user.moderation.daysRemaining);
                if(!user.moderation.hasSeen && (!user.showWelcomeMessage && !user.needsUsernameChange)) {
                    setShowMutedPopup(true);
                }
                // check if moderation object still exists
                checkIfModerationExpired(user.moderation, updateModerationSeenStatus);
            } else {
                setShowMutedPopup(false);
            }
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
    }, [user]);

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
                            />
                        </TabPanel>}
                        <TabPanel index={showQuickMatch ? 1 : 0} value={value}>
                            <CreateGameForm
                                deckPreferences={deckPreferences}
                                deckPreferencesHandlers={deckPreferencesHandlers}
                                deckLink={deckLink}
                                setDeckLink={handleSetDeckLink}
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
            <UsernameChangeRequiredPopup open={showUsernameMustChangePopup}/>
            <UserMutedPopup durationDays={moderationDays!} open={showMutedPopup} onClose={handleCloseMutedPopup}></UserMutedPopup>
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
