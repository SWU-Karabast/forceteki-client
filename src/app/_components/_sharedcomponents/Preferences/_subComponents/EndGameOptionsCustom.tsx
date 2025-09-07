import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import MuiLink from '@mui/material/Link';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';
import { useGame } from '@/app/_contexts/Game.context';
import { useEffect, useState } from 'react';
import { useUser } from '@/app/_contexts/User.context';

function EndGameOptionsCustom() {
    const router = useRouter();
    const { user } = useUser();
    const { sendLobbyMessage, sendMessage, lobbyState, connectedPlayer, isSpectator, statsSubmitNotification } = useGame();
    const [karabastStatsMessage, setKarabastStatsMessage] = useState<{ type: string; message: string } | null>(null);
    const [swuStatsMessage, setSwuStatsMessage] = useState<{ type: string; message: string } | null>(null);

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
            sendLobbyMessage(['onStartGameAsync']);
        }
    };

    useEffect(() => {
        if (statsSubmitNotification) {
            const notification = statsSubmitNotification;

            if (notification.source === 'karabast') {
                setKarabastStatsMessage({
                    type: notification.type,
                    message: notification.message
                });
            } else if (notification.source === 'swustats') {
                setSwuStatsMessage({
                    type: notification.type,
                    message: notification.message
                });
            }
        }
    }, [statsSubmitNotification]);

    // Check if we have any stats messages to show
    const hasStatsMessages = (karabastStatsMessage || swuStatsMessage) && user;

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

    // Function to get color based on notification type
    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'Error':
                return '#d32f2f';
            case 'Warning':
                return '#ff9800';
            default:
                return '#4caf50';
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
            { process.env.NEXT_PUBLIC_DISABLE_CREATE_GAMES === 'true' ?
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Maintenance</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Typography sx={styles.typeographyStyle}>
                        Rematching has been disabled as we are about to begin a quick maintenance. Be back soon!
                    </Typography>
                </Box>
                : (!isSpectator &&
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
                </Box>)
            }
            <Box sx={{ ...styles.functionContainer, mb:'0px' }}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Thanks for playing</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Typography sx={styles.typeographyStyle}>
                    If you run into any issues, please let us know in
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

            {hasStatsMessages && (
                <Box sx={{ ...styles.functionContainer, mt:'35px', mb:'0px' }}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Stats Update Messages</Typography>
                    <Divider sx={{ mb: '20px' }}/>

                    {karabastStatsMessage && (
                        <Typography sx={{
                            ...styles.typeographyStyle,
                            color: getNotificationColor(karabastStatsMessage.type),
                            mb: swuStatsMessage ? '10px' : '0px'
                        }}>
                            <strong>Karabast:</strong> {karabastStatsMessage.message}
                        </Typography>
                    )}

                    {swuStatsMessage && (
                        <Typography sx={{
                            ...styles.typeographyStyle,
                            color: getNotificationColor(swuStatsMessage.type)
                        }}>
                            <strong>SWUStats:</strong> {swuStatsMessage.message}
                        </Typography>
                    )}
                </Box>
            )}
        </>
    );
}
export default EndGameOptionsCustom;
