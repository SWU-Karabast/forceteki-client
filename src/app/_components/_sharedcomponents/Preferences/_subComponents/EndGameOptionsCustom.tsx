import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';
import { useGame } from '@/app/_contexts/Game.context';

function EndGameOptionsCustom() {
    const router = useRouter();
    const { sendLobbyMessage, sendMessage } = useGame();

    const handleReturnHome = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    }

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
                <Typography sx={styles.typographyContainer} variant={'h3'}>Home</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'concede'} text={'Return Home'} buttonFnc={handleReturnHome} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to main page.
                    </Typography>
                </Box>
            </Box>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Rematch</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'standard'} text={'Reset Game/Quick Rematch'} buttonFnc={() => sendLobbyMessage(['onStartGame'])} />
                    <Typography sx={styles.typeographyStyle}>
                        Restart the current game with no deck changes.
                    </Typography>
                </Box>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'standard'} text={'Regular Rematch'} buttonFnc={() => sendLobbyMessage(['regularRematch'])} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to lobby to start a new game with the same opponent.
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
export default EndGameOptionsCustom;
