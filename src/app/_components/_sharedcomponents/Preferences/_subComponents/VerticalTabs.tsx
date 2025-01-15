import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CurrentGameTab
    from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/CurrentGameTab';
import KeyboardShortcutsTab
    from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/KeyboardShortcutsTab';
import CardSleevesTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/CardSleevesTab';
import GameOptionsTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/GameOptionsTab';
import { IVerticalTabsProps } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import EndGameTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/EndGameTab';
import BlockListTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/BlockListTab';
import { useUser } from '@/app/_contexts/User.context';

function tabProps(index: number) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}


function VerticalTabs({ 
    tabs,
    variant = 'gameBoard'
}:IVerticalTabsProps) {
    const [value, setValue] = React.useState(0);
    const { logout } = useUser();

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const renderPreferencesContent = (type: string) => {
        switch (type) {
            case 'currentGame':
                return <CurrentGameTab/>;
            case 'keyboardShortcuts':
                return <KeyboardShortcutsTab/>;
            case 'cardSleeves':
                return <CardSleevesTab/>;
            case 'gameOptions':
                return <GameOptionsTab/>;
            case 'endGame':
                return <EndGameTab/>;
            case 'blockList':
                return <BlockListTab/>;
            default:
                return <Typography>Not Implemented</Typography>;
        }
    };
    const renderLabels = (type: string) => {
        switch (type) {
            case 'currentGame':
                return 'Current Game';
            case 'keyboardShortcuts':
                return 'Keyboard Shortcuts';
            case 'cardSleeves':
                return 'Card Sleeves';
            case 'gameOptions':
                return 'Game Options';
            case 'endGame':
                return 'Current Game';
            case 'blockList':
                return 'Block List';
            case 'logout':
                return 'Log Out'
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
                                onClick={logout} // Your logout function here
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
                        return null; // Don't render a panel for the logout tab
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
        </Box>
    );
}
export default VerticalTabs;