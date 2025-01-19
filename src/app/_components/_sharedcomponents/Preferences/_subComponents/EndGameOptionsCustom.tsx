import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';
import { useGame } from '@/app/_contexts/Game.context';

function EndGameOptionsCustom() {
    const router = useRouter();
    const { sendLobbyMessage, sendMessage, lobbyState, connectedPlayer } = useGame();

    // ------------------------ Additional button functions ------------------------//

    const handleReturnHome = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    }
    const rematchRequest = lobbyState?.rematchRequest || null;
    const isInitiator = rematchRequest && rematchRequest.initiator === connectedPlayer;

    // For the Reset Game/Quick Rematch:
    // - If no rematch request is active, send a request with mode "reset".
    // - If a reset request is active and the current user is not the initiator,
    //   then confirm by sending the actual reset command.
    const handleResetRequestOrConfirm = () => {
        if (!rematchRequest) {
            // Send a request for a reset-type rematch.
            sendLobbyMessage(['requestRematch', 'reset']);
        } else if (rematchRequest.mode === 'reset' && !isInitiator) {
            // Confirm the reset request.
            sendLobbyMessage(['onStartGame']);
        }
    };

    // For the Regular Rematch:
    // - If no request active, send a request with mode "regular".
    // - If a regular rematch request is active and the user is not the initiator,
    //   then confirm it.
    const handleRegularRequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', 'regular']);
        } else if (rematchRequest.mode === 'regular' && !isInitiator) {
            sendLobbyMessage(['rematch']);
        }
    };

    // --- Determine Button State & Text ---
    // For Reset Game:
    let resetButtonText = 'Reset Game/Quick Rematch';
    let resetButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== 'reset') {
            // If the other mode is active, we disable this button.
            resetButtonDisabled = true;
            resetButtonText = 'Disabled';
        } else {
            // A reset request is active.
            if (isInitiator) {
                resetButtonText = 'Waiting for confirmation...';
                resetButtonDisabled = true;
            } else {
                resetButtonText = 'Confirm Reset';
            }
        }
    }

    // For Regular Rematch:
    let regularButtonText = 'Regular Rematch';
    let regularButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== 'regular') {
            // If a different mode is active, disable this button.
            regularButtonDisabled = true;
            regularButtonText = 'Disabled';
        } else {
            // A regular request is active.
            if (isInitiator) {
                regularButtonText = 'Waiting for confirmation...';
                regularButtonDisabled = true;
            } else {
                regularButtonText = 'Confirm Rematch';
            }
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
                <Box sx={{ ...styles.contentContainer, mb: '20px' }}>
                    <PreferenceButton
                        variant={'standard'}
                        text={resetButtonText}
                        buttonFnc={handleResetRequestOrConfirm}
                        disabled={resetButtonDisabled}
                    />
                    <Typography sx={styles.typeographyStyle}>
                        Restart the current game with no deck changes.
                    </Typography>
                </Box>
                <Box sx={{ ...styles.contentContainer, mb: '20px' }}>
                    <PreferenceButton
                        variant={'standard'}
                        text={regularButtonText}
                        buttonFnc={handleRegularRequestOrConfirm}
                        disabled={regularButtonDisabled}
                    />
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
