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
import { useDeckManagement } from '@/app/_hooks/useDeckManagement';
import { 
    setModerationSeenAsync, 
    hasUserSeenUndoPopup, 
    markUndoPopupAsSeen,
    markAnnouncementAsSeen, 
    shouldShowAnnouncement 
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { checkIfModerationExpired } from '@/app/_utils/ModerationUtils';
import NewFeaturePopup from '../_sharedcomponents/HomescreenWelcome/NewFeaturePopup';
import { announcement } from '@/app/_constants/mockData';
import UndoTutorialPopup from '@/app/_components/_sharedcomponents/HomePagePlayMode/UndoTutorialPopup';
import { useDeckErrors } from '@/app/_hooks/useDeckErrors';

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
    const { user, updateWelcomeMessage, updateModerationSeenStatus, updateUndoPopupSeenDate } = useUser();

    // Use shared deck management hook
    const {
        deckPreferences,
        deckPreferencesHandlers,
        deckLink,
        setDeckLink,
        savedDecks,
        fetchDecks,
        isBo3Allowed,
    } = useDeckManagement();

    const { errorState, setError, clearErrorsFunc, setIsJsonDeck, setModalOpen } = useDeckErrors();

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
            borderLeft: '2px solid rgba(112, 251, 110, 0.4)',
            boxShadow: 'inset 3px 0 12px -4px rgba(112, 251, 110, 0.15)',
        },
        tabStyles: {
            color: 'white',
            fontWeight: 'bold',
            typography: 'h3',
        },
        tabsContainer: {
            borderBottom: 1,
            borderColor: 'divider',
            mb: '1rem',
        },
        tabs: {
            '& .MuiTabs-indicator': {
                backgroundColor: 'rgba(112, 251, 110, 0.7)',
                height: '2px',
            },
        },
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
                        <Box sx={styles.tabsContainer}>
                            <Tabs value={value} variant="fullWidth" onChange={handleChange} sx={styles.tabs}>
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
                                setDeckLink={setDeckLink}
                                savedDecks={savedDecks}
                                handleDeckManagement={handleDeckManagement}
                                handleFormSubmissionWithUndoCheck={handleFormSubmissionWithUndoCheck}
                                errorState={errorState}
                                setError={setError}
                                clearErrors={clearErrorsFunc}
                                setIsJsonDeck={setIsJsonDeck}
                                setModalOpen={setModalOpen}
                                isBo3Allowed={isBo3Allowed}
                            />
                        </TabPanel>}
                        <TabPanel index={showQuickMatch ? 1 : 0} value={value}>
                            <CreateGameForm
                                deckPreferences={deckPreferences}
                                deckPreferencesHandlers={deckPreferencesHandlers}
                                deckLink={deckLink}
                                setDeckLink={setDeckLink}
                                savedDecks={savedDecks}
                                handleDeckManagement={handleDeckManagement}
                                handleFormSubmissionWithUndoCheck={handleFormSubmissionWithUndoCheck}
                                errorState={errorState}
                                setError={setError}
                                clearErrors={clearErrorsFunc}
                                setIsJsonDeck={setIsJsonDeck}
                                setModalOpen={setModalOpen}
                                isBo3Allowed={isBo3Allowed}
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
