import React, {
    useState,
    useEffect,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import MuiLink from '@mui/material/Link';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';

function CurrentGameTab() {
    const { sendGameMessage, connectedPlayer, gameState } = useGame();

    const currentPlayerName = gameState.players[connectedPlayer].name
    const [confirmConcede, setConfirmConcede] = useState<boolean>(false);

    useEffect(() => {
        if(confirmConcede){
            const timer = setTimeout(() => setConfirmConcede(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmConcede]);

    // Click handler for the Concede button.
    const handleConcede = () => {
        if (!confirmConcede) {
            setConfirmConcede(true);
        } else {
            // Send the game message only on the second click
            sendGameMessage(['concede', currentPlayerName]);
            // Reset the confirmation
            setConfirmConcede(false);
        }
    };

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
                    <PreferenceButton variant={'concede'} text={confirmConcede ? 'Are you sure?' : 'Concede Game'} buttonFnc={handleConcede}/>
                    <Typography sx={styles.typeographyStyle}>
                        Yield  current game and abandon. This match will count as a loss.
                    </Typography>
                </Box>
            </Box>
            {/* <Box sx={styles.functionContainer}>
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
            </Box> */}
            <Box sx={{ ...styles.functionContainer, mb:'0px' }}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Thanks for playing the Beta</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Typography sx={styles.typeographyStyle}>
                    Thank you for helping us test the beta!
                </Typography>
                <Typography sx={styles.typeographyStyle}>
                    If you run indo any issues, please let us know in  
                    <MuiLink
                        href="https://discord.gg/hKRaqHND4v"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ ml: '4px' }}
                    >
                        Discord
                    </MuiLink>. Thanks!
                </Typography>
            </Box>
        </>
    );
}
export default CurrentGameTab;
