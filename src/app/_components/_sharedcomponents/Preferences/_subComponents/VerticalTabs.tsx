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

function tabProps(index: number) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}


function VerticalTabs({ tabs }:IVerticalTabsProps) {
    const [value, setValue] = React.useState(0);

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
            default:
                return <Typography>Not Implemented</Typography>;
        }
    };
    const renderLabels = (type: string) => {
        switch (type) {
            case 'currentGame':
                return 'CURRENT GAME';
            case 'keyboardShortcuts':
                return 'KEYBOARD SHORTCUTS';
            case 'cardSleeves':
                return 'CARD SLEEVES';
            case 'gameOptions':
                return 'GAME OPTIONS';
            default:
                return null;
        }
    }

    // ------------------------STYLES------------------------//
    const styles = {
        tabContainer: {
            width: '20%',
            backgroundColor: 'transparent',
        },
        tab:{
            color:'white',
            '&.Mui-selected': {
                backgroundColor: 'rgba(47, 125, 182, 0.5)',
                borderRadius:'5px',
                color:'white',
            },
        },
        tabPanelContainer:{
            backgroundColor: 'transparent',
            width: '80%',
            pl:9,
            gap: '20px',
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
                {tabs.map((tabName, idx) => (
                    <Tab
                        key={tabName}
                        sx={styles.tab}
                        label={renderLabels(tabName)}
                        {...tabProps(idx)}
                    />
                ))}
            </Tabs>
            <Box sx={styles.tabPanelContainer}>
                {tabs.map((tabName, idx) => (
                    <Box
                        key={tabName}
                        role="tabpanel"
                        hidden={value !== idx}
                        id={`vertical-tabpanel-${idx}`}
                        aria-labelledby={`vertical-tab-${idx}`}
                    >
                        {value === idx && renderPreferencesContent(tabName)}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
export default VerticalTabs;