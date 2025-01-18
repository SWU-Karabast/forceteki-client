import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';
import { useGame } from '@/app/_contexts/Game.context';

function EndGameOptionsQuickMatch() {
    const router = useRouter();
    const { sendLobbyMessage, sendMessage, resetStates, lobbyState, connectedPlayer } = useGame();

    // Use the rematchRequest property from lobbyState
    const rematchRequest = lobbyState?.rematchRequest;
    const isRequestInitiator = rematchRequest && rematchRequest.initiator === connectedPlayer;


    // ------------------------Additional button functions------------------------//
    const handleReturnHome = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    }

    const handleRequeue = async () => {
        sendMessage('requeue');
        resetStates();
        router.push('/quickGame');
    }
    const handleRematchClick = () => {
        if (!rematchRequest) {
            // Request a regular rematch (for quick match)
            sendLobbyMessage(['requestRematch', 'regular']);
        } else if (rematchRequest.mode === 'regular' && !isRequestInitiator) {
            // Confirm the regular rematch
            sendLobbyMessage(['regularRematch']);
        }
    };

    // Determine button text and behavior based on rematch status
    let rematchButtonText = 'Request Rematch';
    let rematchButtonDisabled = false;
    if (rematchRequest) {
        if (isRequestInitiator) {
            rematchButtonText = 'Waiting for confirmation…';
            rematchButtonDisabled = true;
        } else {
            rematchButtonText = 'Confirm Rematch';
        }
    }

    // ------------------------ Styles ------------------------//
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
                    <PreferenceButton variant={'standard'} text={'New Quick Match'} buttonFnc={handleRequeue}/>
                    <Typography sx={styles.typeographyStyle}>
                        Reenter the queue for a new opponent.
                    </Typography>
                </Box>
                <Box sx={styles.contentContainer}>
                    <PreferenceButton
                        variant={'standard'}
                        text={rematchButtonText}
                        buttonFnc={handleRematchClick}
                        disabled={rematchButtonDisabled}
                    />
                    <Typography sx={styles.typeographyStyle}>
                        {rematchRequest
                            ? isRequestInitiator
                                ? 'Waiting for your opponent to confirm rematch.'
                                : 'Confirm you wish to rematch with your opponent.'
                            : 'Return to lobby to start a new game with the same opponent.'}
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
export default EndGameOptionsQuickMatch;
