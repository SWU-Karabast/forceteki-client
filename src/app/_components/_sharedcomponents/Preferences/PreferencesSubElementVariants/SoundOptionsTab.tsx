import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import VolumeSlider from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VolumeSlider';

function SoundOptionsTab() {
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        optionContainer: {
            mb: '1.5rem',
        },
    };

    const handleVolumeChange = (value: number) => {
        // Here you can implement the logic to actually change the game volume
        console.log('Volume changed to:', value);
        // You might want to store this in user preferences or context
    };

    const handleMuteChange = (muted: boolean) => {
        // Here you can implement the logic to mute/unmute all sounds
        console.log('Mute changed to:', muted);
        // You might want to store this in user preferences or context
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>General Sound</Typography>
                <Divider sx={{ mb: '20px' }}/>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Mute'}
                        optionDescription={'Remove all in-game sounds.'}
                        iconType="mute"
                        onChange={handleMuteChange}
                    />
                </Box>
                <VolumeSlider
                    label="Game Volume"
                    description="Adjust the volume of all game sounds."
                    defaultValue={75}
                    onChange={handleVolumeChange}
                />
            </Box>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>In-game Sound</Typography>
                <Divider sx={{ mb: '20px' }}/>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Card Clicks'}
                        optionDescription={'Sound when clicking on cards.'}
                        iconType="mute"
                        onChange={handleMuteChange}
                    />
                </Box>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Menu Buttons'}
                        optionDescription={'Sound for menu and prompt button interactions.'}
                        iconType="mute"
                        onChange={handleMuteChange}
                    />
                </Box>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Chat'}
                        optionDescription={'Sound for incoming chat messages.'}
                        iconType="mute"
                        onChange={handleMuteChange}
                    />
                </Box>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Opponent Found'}
                        optionDescription={'Sound when an opponent is found.'}
                        iconType="mute"
                        onChange={handleMuteChange}
                    />
                </Box>
            </Box>
        </>
    );
}

export default SoundOptionsTab;