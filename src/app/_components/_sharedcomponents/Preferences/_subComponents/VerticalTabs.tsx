import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CurrentGameTab
    from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/CurrentGameTab';
import KeyboardShortcuts
    from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/KeyboardShortcuts';
import CardSleeves from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/CardSleeves';
import GameOptions from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/GameOptions';

function a11yProps(index: number) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

function VerticalTabs() {
    const [value, setValue] = React.useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

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
                <Tab sx={styles.tab} label="Current Game" {...a11yProps(0)} />
                <Tab sx={styles.tab} label="Keyboard Shortcuts" {...a11yProps(1)} />
                <Tab sx={styles.tab} label="Card Sleeves" {...a11yProps(2)} />
                <Tab sx={styles.tab} label="Game Options" {...a11yProps(3)} />
            </Tabs>
            <Box sx={styles.tabPanelContainer}>
                <Box
                    role="tabpanel"
                    hidden={value !== 0}
                    id={`vertical-tabpanel-${0}`}
                    aria-labelledby={`vertical-tab-${0}`}
                >
                    <CurrentGameTab/>
                </Box>
                <Box
                    role="tabpanel"
                    hidden={value !== 1}
                    id={`vertical-tabpanel-${1}`}
                    aria-labelledby={`vertical-tab-${1}`}
                >
                    <KeyboardShortcuts/>
                </Box>
                <Box
                    role="tabpanel"
                    hidden={value !== 2}
                    id={`vertical-tabpanel-${2}`}
                    aria-labelledby={`vertical-tab-${2}`}
                >
                    <CardSleeves/>
                </Box>
                <Box
                    role="tabpanel"
                    hidden={value !== 3}
                    id={`vertical-tabpanel-${3}`}
                    aria-labelledby={`vertical-tab-${3}`}
                >
                    <GameOptions/>
                </Box>
            </Box>
        </Box>
    );
}
export default VerticalTabs;