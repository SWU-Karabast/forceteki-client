import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

function EndGameTab() {
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer:{
            mb:'3.5rem',
        },
        typeographyStyle:{
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
        }
    }

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Current Game</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={styles.contentContainer}>
                    <PreferenceButton variant={'concede'} text={'Return Home'} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to main page.
                    </Typography>
                </Box>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'standard'} text={'Reset Game/Quick Rematch'} />
                    <Typography sx={styles.typeographyStyle}>
                        Restart the current game with no deck changes
                    </Typography>
                </Box>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'standard'} text={'Regular Rematch'} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to lobby to start new game with options for changing decks/sideboarding
                    </Typography>
                </Box>
            </Box>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Statistics</Typography>
                <Divider sx={{ mb: '20px' }}/>
            </Box>
        </>
    );
}
export default EndGameTab;
