import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import MuiLink from '@mui/material/Link';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import Bo3ScoreDisplay from '@/app/_components/_sharedcomponents/Preferences/_subComponents/Bo3ScoreDisplay';
import { useRouter } from 'next/navigation';
import { useGame } from '@/app/_contexts/Game.context';
import { useEffect, useState } from 'react';
import { StatsSource } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { Bo3SetEndedReason, GamesToWinMode, IBo3SetEndResult, MatchmakingType, RematchMode } from '@/app/_constants/constants';

interface IProps {
    handleOpenBugReport: () => void;
    gameType: MatchmakingType;
}

function EndGameOptions({ handleOpenBugReport, gameType }: IProps) {
    const router = useRouter();
    const { sendLobbyMessage, sendMessage, resetStates, lobbyState, connectedPlayer, isSpectator, statsSubmitNotification, gameState, getOpponent } = useGame();
    const [karabastStatsMessage, setKarabastStatsMessage] = useState<{ type: string; message: string } | null>(null);
    const [swuStatsMessage, setSwuStatsMessage] = useState<{ type: string; message: string } | null>(null);
    const [confirmConcedeBo3, setConfirmConcedeBo3] = useState<boolean>(false);

    const isQuickMatch = gameType === MatchmakingType.Quick;

    // Use the rematchRequest property from lobbyState
    const rematchRequest = lobbyState?.rematchRequest || null;
    const isRequestInitiator = rematchRequest && rematchRequest.initiator === connectedPlayer;

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const winsPerPlayer: Record<string, number> = winHistory?.winsPerPlayer || {};
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const hasConfirmedNextGame = lobbyState?.hasConfirmedNextGame || false;
    const setEndResult: IBo3SetEndResult | null = winHistory?.setEndResult || null;

    // Determine if we're in Bo3 mode and if the set is complete
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const isBo3SetComplete = isBo3Mode && !!setEndResult;

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

    useEffect(() => {
        if (confirmConcedeBo3) {
            const timer = setTimeout(() => setConfirmConcedeBo3(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmConcedeBo3]);

    // ------------------------ Button Handlers ------------------------//

    const handleReturnHome = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    };

    // Click handler for the Concede Bo3 Set button.
    const handleConcedeBo3 = () => {
        if (!confirmConcedeBo3) {
            setConfirmConcedeBo3(true);
        } else {
            // Send the lobby message only on the second click
            sendLobbyMessage(['concedeBo3']);
            // Reset the confirmation
            setConfirmConcedeBo3(false);
        }
    };

    const handleRequeue = async () => {
        sendMessage('requeue');
        resetStates();
        router.push('/quickGame');
    };

    // For Reset Game/Quick Rematch (Bo1 Custom mode only):
    // - If no rematch request is active, send a request with mode "reset".
    // - If a reset request is active and the current user is not the initiator,
    //   then confirm by sending the actual reset command.
    const handleResetRequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', RematchMode.Reset]);
        } else if (rematchRequest.mode === RematchMode.Reset && !isRequestInitiator) {
            sendLobbyMessage(['startGameAsync']);
        }
    };

    // For the Regular Rematch:
    // - If no request active, send a request with mode "regular".
    // - If a regular rematch request is active and the user is not the initiator,
    //   then confirm it.
    const handleRegularRequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', RematchMode.Regular]);
        } else if (rematchRequest.mode === RematchMode.Regular && !isRequestInitiator) {
            sendLobbyMessage(['rematch']);
        }
    };

    // For Convert to Bo3 (Bo1 only):
    // - If no request active, send a request with mode "bo1ConvertToBo3".
    // - If a bo1ConvertToBo3 request is active and the user is not the initiator,
    //   then confirm it.
    const handleConvertToBo3RequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', RematchMode.Bo1ConvertToBo3]);
        } else if (rematchRequest.mode === RematchMode.Bo1ConvertToBo3 && !isRequestInitiator) {
            sendLobbyMessage(['rematch']);
        }
    };

    // For New Bo3 Set (Bo3 only, after set completes):
    // - If no request active, send a request with mode "newBo3".
    // - If a newBo3 request is active and the user is not the initiator,
    //   then confirm it.
    const handleNewBo3RequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', RematchMode.NewBo3]);
        } else if (rematchRequest.mode === RematchMode.NewBo3 && !isRequestInitiator) {
            sendLobbyMessage(['rematch']);
        }
    };

    // For proceeding to next game in Bo3 mid-set:
    const handleProceedToNextGame = () => {
        sendLobbyMessage(['proceedToNextBo3Game']);
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

    // For Reset Game (Bo1 Custom mode only):
    let resetButtonText = 'Reset Game/Quick Rematch';
    let resetButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== RematchMode.Reset) {
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

    // For Regular Rematch (Bo1 only):
    let regularButtonText = isQuickMatch ? 'Request Rematch' : 'Regular Rematch';
    let regularButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== RematchMode.Regular) {
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

    // For Convert to Bo3 (Bo1 only):
    let convertToBo3ButtonText = 'Convert to Best of 3';
    let convertToBo3ButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== RematchMode.Bo1ConvertToBo3) {
            convertToBo3ButtonDisabled = true;
            convertToBo3ButtonText = 'Disabled';
        } else {
            if (isRequestInitiator) {
                convertToBo3ButtonText = 'Waiting for confirmation...';
                convertToBo3ButtonDisabled = true;
            } else {
                convertToBo3ButtonText = 'Confirm Convert to Bo3';
            }
        }
    }

    // For Rematch Bo3 (Bo3 set complete only):
    let newBo3ButtonText = 'Rematch Bo3';
    let newBo3ButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== RematchMode.NewBo3) {
            newBo3ButtonDisabled = true;
            newBo3ButtonText = 'Disabled';
        } else {
            if (isRequestInitiator) {
                newBo3ButtonText = 'Waiting for confirmation...';
                newBo3ButtonDisabled = true;
            } else {
                newBo3ButtonText = 'Confirm New Bo3';
            }
        }
    }

    // For Ready for Next Game (Bo3 mid-set only):
    let readyForNextGameButtonText = 'Ready for Next Game';
    let readyForNextGameButtonDisabled = false;
    if (hasConfirmedNextGame) {
        readyForNextGameButtonText = 'Waiting for opponent...';
        readyForNextGameButtonDisabled = true;
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

                {/* Ready for Next Game - Bo3 mid-set only (shown first) */}
                {isBo3Mode && !isBo3SetComplete && !isSpectator && !isMaintenanceMode && (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton
                            variant={'standard'}
                            text={readyForNextGameButtonText}
                            buttonFnc={handleProceedToNextGame}
                            disabled={readyForNextGameButtonDisabled}
                            sx={hasConfirmedNextGame ? {
                                minWidth: '140px',
                            } : {
                                minWidth: '140px',
                                background: 'linear-gradient(#0a3d1e, #0a3d1e) padding-box, linear-gradient(to top, #1cb34a, #0a3d1e) border-box',
                                '&:hover': {
                                    background: 'linear-gradient(#0d4d26, #0d4d26) padding-box, linear-gradient(to top, #2ad44c, #0a3d1e) border-box',
                                },
                            }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            {hasConfirmedNextGame
                                ? 'Waiting for your opponent to confirm they are ready.'
                                : 'Confirm you are ready to proceed to the next game.'}
                        </Typography>
                    </Box>
                )}

                {/* Concede Bo3 Set - Bo3 mid-set only (non-spectator) */}
                {isBo3Mode && !isBo3SetComplete && !isSpectator ? (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton
                            variant={'concede'}
                            text={confirmConcedeBo3 ? 'Are you sure?' : 'Concede Bo3 Set'}
                            buttonFnc={handleConcedeBo3}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Yield entire Bo3 set. The set will count as a loss.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton variant={'concede'} text={'Return Home'} buttonFnc={handleReturnHome} />
                        <Typography sx={styles.typeographyStyle}>
                            Return to main page.
                        </Typography>
                    </Box>
                )}

                {/* New Bo3 Set - Bo3 set complete only */}
                {isBo3Mode && isBo3SetComplete && !isSpectator && !isMaintenanceMode && (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton
                            variant={'standard'}
                            text={newBo3ButtonText}
                            buttonFnc={handleNewBo3RequestOrConfirm}
                            disabled={newBo3ButtonDisabled}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            {rematchRequest && rematchRequest.mode === RematchMode.NewBo3
                                ? isRequestInitiator
                                    ? 'Waiting for your opponent to confirm Bo3 rematch.'
                                    : 'Confirm you wish to start a new best of 3 set.'
                                : 'Start a fresh best of 3 set with your opponent.'}
                        </Typography>
                    </Box>
                )}

                {/* Requeue - Bo3 QuickMatch set complete only */}
                {isBo3Mode && isBo3SetComplete && isQuickMatch && !isSpectator && !isMaintenanceMode && (
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton variant={'standard'} text={'Requeue'} buttonFnc={handleRequeue} />
                        <Typography sx={styles.typeographyStyle}>
                            Reenter the queue for a new opponent.
                        </Typography>
                    </Box>
                )}

                {/* Report Bug - Bo3 mode only (in Actions section) */}
                {isBo3Mode && !isSpectator && (
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
                )}
            </Box>

            {/* Bo3 Score Section */}
            {isBo3Mode && gameState?.players && (
                <Bo3ScoreDisplay
                    currentGameNumber={currentGameNumber}
                    winsPerPlayer={winsPerPlayer}
                    players={gameState.players}
                    connectedPlayer={connectedPlayer}
                    isBo3SetComplete={isBo3SetComplete}
                    setEndResult={setEndResult}
                    isSpectator={isSpectator}
                    getOpponent={getOpponent}
                    playerNames={winHistory?.playerNames}
                />
            )}

            {isMaintenanceMode ? (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Maintenance</Typography>
                    <Divider sx={{ mb: '20px' }} />
                    <Typography sx={styles.typeographyStyle}>
                        Rematching has been disabled as we are about to begin a quick maintenance. Be back soon!
                    </Typography>
                </Box>
            ) : (
                !isSpectator && !isBo3Mode && (
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

                        {/* Regular Rematch */}
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

                        {/* Convert to Best of 3 */}
                        <Box sx={styles.contentContainer}>
                            <PreferenceButton
                                variant={'standard'}
                                text={convertToBo3ButtonText}
                                buttonFnc={handleConvertToBo3RequestOrConfirm}
                                disabled={convertToBo3ButtonDisabled}
                            />
                            <Typography sx={styles.typeographyStyle}>
                                {rematchRequest && rematchRequest.mode === RematchMode.Bo1ConvertToBo3
                                    ? isRequestInitiator
                                        ? 'Waiting for your opponent to confirm conversion to Bo3.'
                                        : 'Confirm you wish to convert this match to a best of 3.'
                                    : 'Convert this match to a best of 3, counting this game as game 1.'}
                            </Typography>
                        </Box>

                        {/* Report Bug */}
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
