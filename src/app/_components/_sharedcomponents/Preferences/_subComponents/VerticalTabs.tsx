import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useEffect, useState } from 'react';
import CurrentGameTab
    from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/CurrentGameTab';
import KeyboardShortcutsTab
    from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/KeyboardShortcutsTab';
import CardSleevesTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/CardSleevesTab';
import SoundOptionsTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/SoundOptionsTab';
import { IVerticalTabsProps } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import EndGameTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/EndGameTab';
import BlockListTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/BlockListTab';
import { useUser } from '@/app/_contexts/User.context';
import GeneralTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/GeneralTab';
import UnsavedChangesDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/UnsavedChangesDialog';

function tabProps(index: number) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}


enum TabType {
    CURRENT_GAME = 'currentGame',
    KEYBOARD_SHORTCUTS = 'keyboardShortcuts',
    CARD_SLEEVES = 'cardSleeves',
    SOUND_OPTIONS = 'soundOptions',
    END_GAME = 'endGame',
    BLOCK_LIST = 'blockList',
    GENERAL = 'general',
    LOGOUT = 'logout'
}

function VerticalTabs({ 
    tabs,
    variant = 'gameBoard'
}:IVerticalTabsProps) {
    const [value, setValue] = useState(0);
    const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
    const [pendingTabIndex, setPendingTabIndex] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const { logout } = useUser();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (tabs[value] === 'soundOptions' && hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved sound preferences. Are you sure you want to leave?';
            }
        };

        window.addEventListener('beforeUnload', handleBeforeUnload);
        return () => window.removeEventListener('beforeUnload', handleBeforeUnload);
    }, [tabs, value, hasUnsavedChanges]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        // Check if leaving sound options with unsaved changes
        if (tabs[value] === 'soundOptions' && hasUnsavedChanges && newValue !== value) {
            setPendingTabIndex(newValue);
            setShowUnsavedDialog(true);
        } else {
            setValue(newValue);
        }
    };

    const handleDialogDiscard = () => {
        setShowUnsavedDialog(false);
        // Tell SoundOptionsTab to reset (you'll need to expose this)
        if (pendingTabIndex !== null) {
            setValue(pendingTabIndex);
        }
        setPendingTabIndex(null);
    };

    const handleDialogCancel = () => {
        setShowUnsavedDialog(false);
        setPendingTabIndex(null);
    };

    const renderPreferencesContent = (type: string) => {
        switch (type) {
            case TabType.CURRENT_GAME:
                return <CurrentGameTab/>;
            case TabType.KEYBOARD_SHORTCUTS:
                return <KeyboardShortcutsTab/>;
            case TabType.CARD_SLEEVES:
                return <CardSleevesTab/>;
            case TabType.SOUND_OPTIONS:
                return <SoundOptionsTab setHasNewChanges={setHasUnsavedChanges}/>;
            case TabType.END_GAME:
                return <EndGameTab/>;
            case TabType.BLOCK_LIST:
                return <BlockListTab/>;
            case TabType.GENERAL:
                return <GeneralTab/>;
            default:
                return <Typography>Not Implemented</Typography>;
        }
    };
    const renderLabels = (type: string) => {
        switch (type) {
            case TabType.CURRENT_GAME:
                return 'Current Game';
            case TabType.KEYBOARD_SHORTCUTS:
                return 'Keyboard Shortcuts';
            case TabType.CARD_SLEEVES:
                return 'Card Sleeves';
            case TabType.SOUND_OPTIONS:
                return 'Sound Options';
            case TabType.END_GAME:
                return 'Current Game';
            case TabType.BLOCK_LIST:
                return 'Block List';
            case TabType.LOGOUT:
                return 'Log Out'
            case TabType.GENERAL:
                return 'General';
            default:
                return null;
        }
    }

    // ------------------------STYLES------------------------//
    const styles = {
        tabContainer: {
            width: '20%',
            backgroundColor: 'transparent',
            gap:'1rem',
        },
        tab:{
            color:'white',
            alignItems: 'start',
            textTransform: 'none',
            fontSize: '1.2rem',
            height:'4rem',
            mb:'10px',
            '&.Mui-selected': {
                backgroundColor: 'rgba(47, 125, 182, 0.5)',
                borderRadius:'5px',
                color:'white',
            },
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.5)',
                borderRadius:'5px',
                color:'white',
            }
        },
        tabPanelContainer:{
            backgroundColor: 'transparent',
            width: '80%',
            pl:9,
            gap: '20px',
            maxHeight: variant === 'gameBoard' ? 'calc(80vh - 1rem)' : 'calc(80vh - 1.9rem)',
            overflowY: 'auto',
            '::-webkit-scrollbar': {
                width: '0.2vw',
            },
            '::-webkit-scrollbar-thumb': {
                backgroundColor: '#D3D3D3B3',
                borderRadius: '1vw',
            },
            '::-webkit-scrollbar-button': {
                display: 'none',
            },
            transition: 'scrollbar-color 0.3s ease-in-out',
        }
    }

    return (
        <Box
            sx={{ display: 'flex', background: 'transparent' }}
        >
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={value}
                onChange={handleChange}
                TabIndicatorProps={{
                    style: { display: 'none' }
                }}
                sx={styles.tabContainer}
            >
                {tabs.map((tabName, idx) => {
                    if (tabName === 'logout') {
                        return (
                            <Tab
                                key={tabName}
                                sx={styles.tab}
                                label={renderLabels(tabName)}
                                onClick={logout}
                                {...tabProps(idx)}
                            />
                        );
                    }
                    return (
                        <Tab
                            key={tabName}
                            sx={styles.tab}
                            label={renderLabels(tabName)}
                            {...tabProps(idx)}
                        />
                    );
                })}
            </Tabs>
            <Box sx={styles.tabPanelContainer}>
                {tabs.map((tabName, idx) => {
                    if (tabName === 'logout') {
                        return null;
                    }
                    return (
                        <Box
                            key={tabName}
                            role="tabpanel"
                            hidden={value !== idx}
                            id={`vertical-tabpanel-${idx}`}
                            aria-labelledby={`vertical-tab-${idx}`}
                            sx={{ overflow: 'hidden' }}
                        >
                            {value === idx && renderPreferencesContent(tabName)}
                        </Box>
                    );
                })}
            </Box>
            <UnsavedChangesDialog
                open={showUnsavedDialog}
                onDiscard={handleDialogDiscard}
                onCancel={handleDialogCancel}
            />
        </Box>
    );
}
export default VerticalTabs;