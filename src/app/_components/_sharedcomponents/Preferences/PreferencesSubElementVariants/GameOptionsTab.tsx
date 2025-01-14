import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';

function GameOptionsTab() {
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer:{
            mb:'3.5rem',
        },
    }

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Graphics & Sound</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <PreferenceOption option={'Dynamic Scaling (beta)'} optionDescription={'UI elements adjust dynamically to the viewport.'}/>
                <PreferenceOption option={'Accesibility Mode'} optionDescription={'Changes the UI with larger texts, more contrast elements.'}/>
                <PreferenceOption option={'Mute'} optionDescription={'Remove all in-game sounds.'}/>
            </Box>
            <Box sx={{ ...styles.functionContainer, mb:'0px' }}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Options</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <PreferenceOption option={'Disable Chat'} optionDescription={'Text messages with opponent are not allowed.'}/>
                <PreferenceOption option={'Disable Stats'} optionDescription={'Game results will not be saved in your profile history.'}/>
                <PreferenceOption option={'Disable Animations'} optionDescription={'Improve performance.'}/>
                <PreferenceOption option={'Enable Caster Mode'} optionDescription={'Improves the quality of the UI for streaming purposes.'}/>
                <PreferenceOption option={'Enable Streamer Mode'} optionDescription={'Improves the quality of the UI for streaming purposes.'}/>
            </Box>
        </>
    );
}
export default GameOptionsTab;
