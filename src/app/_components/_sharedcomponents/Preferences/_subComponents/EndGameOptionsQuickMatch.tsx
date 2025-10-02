import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import MuiLink from '@mui/material/Link';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';
import { useGame } from '@/app/_contexts/Game.context';
import { useEffect, useState } from 'react';
import { StatsSource } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

function EndGameOptionsQuickMatch() {
    const router = useRouter();
    const { sendLobbyMessage, sendMessage, resetStates, lobbyState, connectedPlayer, isSpectator, gameState, statsSubmitNotification } = useGame();
    const [karabastStatsMessage, setKarabastStatsMessage] = useState<{ type: string; message: string } | null>(null);
    const [swuStatsMessage, setSwuStatsMessage] = useState<{ type: string; message: string } | null>(null);


    // Use the rematchRequest property from lobbyState
    const rematchRequest = lobbyState?.rematchRequest;
    const isRequestInitiator = rematchRequest && rematchRequest.initiator === connectedPlayer;

    useEffect(() => {
        if (statsSubmitNotification) {
            const notification = statsSubmitNotification;

            console.log('Received stats notification', statsSubmitNotification);

            if (notification.source === StatsSource.Karabast) {
                setKarabastStatsMessage({
                    type: notification.type,
                    message: notification.message
                });
            } else if (notification.source === StatsSource.SwuStats) {
                setSwuStatsMessage({
                    type: notification.type,
                    message: notification.message
                });
            }
        }
    }, [statsSubmitNotification]);


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

    // Check if we have any stats messages to show
    const hasStatsMessages = karabastStatsMessage || swuStatsMessage;

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
                <Typography sx={styles.typographyContainer} variant={'h3'}>Actions</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'concede'} text={'Return Home'} buttonFnc={handleReturnHome} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to main page.
                    </Typography>
                </Box>
                {!isSpectator && (
                    <Box sx={styles.functionContainer}>
                        <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                            <PreferenceButton variant={'standard'} text={'Requeue'} buttonFnc={handleRequeue}/>
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
                )}
            </Box>
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
                <Box sx={{ ...styles.functionContainer, mt:'35px', mb:'0px', height: '7rem' }}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Deck Stats</Typography>
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
                            color: getNotificationColor(swuStatsMessage.type),
                            mb: '10px'
                        }}>
                            <strong>SWUStats:</strong> {swuStatsMessage.message}
                        </Typography>
                    )}
                </Box>
            )}
        </>
    );
}
export default EndGameOptionsQuickMatch;
