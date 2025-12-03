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

export enum GameMode {
    QuickMatch = 'quickMatch',
    Custom = 'custom'
}

interface IProps {
    handleOpenBugReport: () => void;
    gameMode: GameMode;
}

function EndGameOptions({ handleOpenBugReport, gameMode }: IProps) {
    const router = useRouter();
    const { sendLobbyMessage, sendMessage, resetStates, lobbyState, connectedPlayer, isSpectator, statsSubmitNotification } = useGame();
    const [karabastStatsMessage, setKarabastStatsMessage] = useState<{ type: string; message: string } | null>(null);
    const [swuStatsMessage, setSwuStatsMessage] = useState<{ type: string; message: string } | null>(null);

    const isQuickMatch = gameMode === GameMode.QuickMatch;

    // Use the rematchRequest property from lobbyState
    const rematchRequest = lobbyState?.rematchRequest || null;
    const isRequestInitiator = rematchRequest && rematchRequest.initiator === connectedPlayer;

    useEffect(() => {
        if (statsSubmitNotification) {
            const notification = statsSubmitNotification;

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

    // ------------------------ Button Handlers ------------------------//

    const handleReturnHome = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    };

    const handleRequeue = async () => {
        sendMessage('requeue');
        resetStates();
        router.push('/quickGame');
    };

    // For Reset Game/Quick Rematch (Custom mode only):
    // - If no rematch request is active, send a request with mode "reset".
    // - If a reset request is active and the current user is not the initiator,
    //   then confirm by sending the actual reset command.
    const handleResetRequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', 'reset']);
        } else if (rematchRequest.mode === 'reset' && !isRequestInitiator) {
            sendLobbyMessage(['onStartGameAsync']);
        }
    };

    // For the Regular Rematch:
    // - If no request active, send a request with mode "regular".
    // - If a regular rematch request is active and the user is not the initiator,
    //   then confirm it.
    const handleRegularRequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', 'regular']);
        } else if (rematchRequest.mode === 'regular' && !isRequestInitiator) {
            if (isQuickMatch) {
                sendLobbyMessage(['rematch']);
            } else {
                sendLobbyMessage(['rematch']);
            }
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

    // For Reset Game (Custom mode only):
    let resetButtonText = 'Reset Game/Quick Rematch';
    let resetButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== 'reset') {
            resetButtonDisabled = true;
            resetButtonText = 'Disabled';
        } else {
            if (isRequestInitiator) {
                resetButtonText = 'Waiting for confirmation...';
                resetButtonDisabled = true;
            } else {
                resetButtonText = 'Confirm Reset';
            }
        }
    }

    // For Regular Rematch:
    let regularButtonText = isQuickMatch ? 'Request Rematch' : 'Regular Rematch';
    let regularButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== 'regular') {
            regularButtonDisabled = true;
            regularButtonText = 'Disabled';
        } else {
            if (isRequestInitiator) {
                regularButtonText = 'Waiting for confirmation...';
                regularButtonDisabled = true;
            } else {
                regularButtonText = 'Confirm Rematch';
            }
        }
    }

    // Check if we have any stats messages to show
    const hasStatsMessages = karabastStatsMessage || swuStatsMessage;

    // Check if maintenance mode is enabled
    const isMaintenanceMode = process.env.NEXT_PUBLIC_DISABLE_CREATE_GAMES === 'true';

    // ------------------------ Styles ------------------------//
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        typeographyStyle: {
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
        contentContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            mb: '20px',
        }
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Actions</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Box sx={styles.contentContainer}>
                    <PreferenceButton variant={'concede'} text={'Return Home'} buttonFnc={handleReturnHome} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to main page.
                    </Typography>
                </Box>
            </Box>

            {isMaintenanceMode ? (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Maintenance</Typography>
                    <Divider sx={{ mb: '20px' }} />
                    <Typography sx={styles.typeographyStyle}>
                        Rematching has been disabled as we are about to begin a quick maintenance. Be back soon!
                    </Typography>
                </Box>
            ) : (
                !isSpectator && (
                    <Box sx={styles.functionContainer}>
                        <Typography sx={styles.typographyContainer} variant={'h3'}>
                            {isQuickMatch ? 'Actions' : 'Rematch'}
                        </Typography>
                        <Divider sx={{ mb: '20px' }} />

                        {/* Requeue - QuickMatch only */}
                        {isQuickMatch && (
                            <Box sx={styles.contentContainer}>
                                <PreferenceButton variant={'standard'} text={'Requeue'} buttonFnc={handleRequeue} />
                                <Typography sx={styles.typeographyStyle}>
                                    Reenter the queue for a new opponent.
                                </Typography>
                            </Box>
                        )}

                        {/* Reset Game/Quick Rematch - Custom only */}
                        {!isQuickMatch && (
                            <Box sx={styles.contentContainer}>
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
                        )}

                        {/* Regular Rematch - Both modes */}
                        <Box sx={styles.contentContainer}>
                            <PreferenceButton
                                variant={'standard'}
                                text={regularButtonText}
                                buttonFnc={handleRegularRequestOrConfirm}
                                disabled={regularButtonDisabled}
                            />
                            <Typography sx={styles.typeographyStyle}>
                                {rematchRequest
                                    ? isRequestInitiator
                                        ? 'Waiting for your opponent to confirm rematch.'
                                        : 'Confirm you wish to rematch with your opponent.'
                                    : 'Return to lobby to start a new game with the same opponent.'}
                            </Typography>
                        </Box>

                        {/* Report Bug - Both modes */}
                        <Box sx={styles.contentContainer}>
                            <PreferenceButton
                                variant={'standard'}
                                text={'Report Bug'}
                                buttonFnc={handleOpenBugReport}
                                sx={{ minWidth: '140px' }}
                            />
                            <Typography sx={styles.typeographyStyle}>
                                Report a bug to the developer team
                            </Typography>
                        </Box>
                    </Box>
                )
            )}

            <Box sx={{ ...styles.functionContainer, mb: '0px' }}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Thanks for playing</Typography>
                <Divider sx={{ mb: '20px' }} />
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
                <Box sx={{ ...styles.functionContainer, mt: '35px', mb: '0px', height: '7rem' }}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Deck Stats</Typography>
                    <Divider sx={{ mb: '20px' }} />

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

export default EndGameOptions;
