import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';

function CurrentGameTab() {
    const { sendGameMessage, connectedPlayer, gameState } = useGame();

    const currentPlayerName = gameState.players[connectedPlayer].name
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
                <Typography sx={styles.typographyContainer} variant={'h3'}>Concede</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={styles.contentContainer}>
                    <PreferenceButton variant={'concede'} text={'Concede Game'} buttonFnc={() => sendGameMessage(['concede',currentPlayerName])}/>
                    <Typography sx={styles.typeographyStyle}>
                        Yield  current game and abandon. This match will count as a loss.
                    </Typography>
                </Box>
            </Box>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Undo</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'standard'} text={'Simple Undo'} />
                    <Typography sx={styles.typeographyStyle}>
                        Revert to your previous game state.
                    </Typography>
                </Box>
                <Box sx={styles.contentContainer}>
                    <PreferenceButton variant={'standard'} text={'This Turn'} />
                    <Typography sx={styles.typeographyStyle}>
                        Revert to the start of the previous turn.
                    </Typography>
                </Box>
            </Box>
            <Box sx={{ ...styles.functionContainer, mb:'0px' }}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Report Bug</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Typography sx={styles.typeographyStyle}>
                    Thank you for reporting a bug.
                    <br/>
                    To describe what happened, please report it on the discord server with the game number for reference (3148735-0)
                </Typography>
            </Box>
        </>
    );
}
export default CurrentGameTab;
