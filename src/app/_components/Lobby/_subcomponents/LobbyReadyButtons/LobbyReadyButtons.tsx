import React, { useState, useEffect } from 'react';
import { Box, Button, CardActions, Typography } from '@mui/material';
import { FiCheckCircle, FiCircle } from 'react-icons/fi';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { GamesToWinMode } from '@/app/_constants/constants';

interface ILobbyReadyButtonsProps {
    readyStatus: boolean;
    isOwner: boolean;
    blockError?: boolean;
    hasDeck?: boolean;
}

const styles = {
    buttonsContainerStyle: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: '4rem',
        flexWrap: 'wrap',
    },
    readyButton: (ready: boolean) => ({
        width: { xs: '100%', sm: '360px' },
        minHeight: '64px',
        padding: '10px 22px',
        border: `2px solid ${ready ? '#5fae46' : '#e5ad2d'}`,
        borderRadius: '14px',
        color: ready ? '#fff' : '#e5ad2d',
        backgroundColor: 'transparent',
        textTransform: 'none',
        '&:hover': {
            borderColor: ready ? '#75c95c' : '#f2c34c',
            backgroundColor: 'transparent',
        },
    }),
    readyButtonContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
    },
    readyButtonText: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        lineHeight: 1,
    },
    concedeButton: {
        backgroundColor: '#8B0000',
        '&:hover': {
            backgroundColor: '#A00000',
        },
    },
};

function LobbyReadyButtons({ readyStatus, isOwner, blockError = false, hasDeck = true }: ILobbyReadyButtonsProps) {
    const { sendLobbyMessage, lobbyState, connectedPlayer } = useGame();
    const [confirmConcede, setConfirmConcede] = useState<boolean>(false);

    const opponentUser = lobbyState?.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer);
    const opponentReady = opponentUser?.ready || false;
    const bothReady = readyStatus && opponentReady;

    // Bo3 detection: check if we're in a Bo3 game after the first game
    const winHistory = lobbyState?.winHistory;
    const isBo3Mode = winHistory?.gamesToWinMode === GamesToWinMode.BestOfThree;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const isBo3AfterFirstGame = isBo3Mode && currentGameNumber > 1;

    // Auto-reset confirm state after 5 seconds
    useEffect(() => {
        if (confirmConcede) {
            const timer = setTimeout(() => setConfirmConcede(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmConcede]);

    const handleReadyClick = () => {
        sendLobbyMessage(['setReadyStatus', !readyStatus]);
    };

    const handleStartGame = () => {
        sendLobbyMessage(['startGameAsync']);
    };

    const handleConcedeClick = () => {
        if (!confirmConcede) {
            setConfirmConcede(true);
        } else {
            sendLobbyMessage(['concedeBo3']);
            setConfirmConcede(false);
        }
    };

    const readyToggle = (
        <Button
            disabled={blockError}
            onClick={handleReadyClick}
            aria-label={readyStatus ? 'Mark as not ready' : 'Mark as ready'}
            aria-pressed={readyStatus}
            sx={styles.readyButton(readyStatus)}
        >
            <Box sx={styles.readyButtonContent}>
                <Box
                    component={readyStatus ? FiCheckCircle : FiCircle}
                    sx={{
                        color: readyStatus ? '#5fae46' : 'inherit',
                        display: 'block',
                        fontSize: 32,
                        flexShrink: 0,
                        strokeWidth: 1.5,
                    }}
                />
                <Box sx={styles.readyButtonText}>
                    <Typography component="span" sx={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, lineHeight: 1 }}>
                        {readyStatus ? 'Ready' : 'Mark as ready'}
                    </Typography>
                    {readyStatus && (
                        <Typography component="span" sx={{ margin: 0, fontSize: '1rem', fontWeight: 400, lineHeight: 1 }}>
                            · {opponentReady ? 'Both players ready' : 'Waiting for rival'}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Button>
    );

    // If no opponent yet, don't show buttons
    if (!opponentUser) {
        return null;
    }

    // If user doesn't have a deck, show message
    if (!hasDeck) {
        return <Typography>Please import a deck</Typography>;
    }

    // Bo3 after first game: both ready means game auto-starts
    if (isBo3AfterFirstGame && bothReady) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6">
                    Both players are ready. Starting game...
                </Typography>
            </Box>
        );
    }

    // Both ready and owner - show start game button (Bo1 or Bo3 first game only)
    if (bothReady && isOwner && !isBo3AfterFirstGame) {
        return (
            <>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6">
                        Both players are ready.
                    </Typography>
                </Box>
                <CardActions sx={styles.buttonsContainerStyle}>
                    <Button variant="contained" onClick={handleStartGame}>
                        Start Game
                    </Button>
                    {readyToggle}
                </CardActions>
            </>
        );
    }

    // Not both ready - show ready toggle button (and concede for Bo3 after first game)
    return (
        <CardActions sx={styles.buttonsContainerStyle}>
            {readyToggle}
            {isBo3AfterFirstGame && (
                <Button
                    variant="contained"
                    onClick={handleConcedeClick}
                    sx={styles.concedeButton}
                >
                    {confirmConcede ? 'Are you sure?' : 'Concede'}
                </Button>
            )}
        </CardActions>
    );
}

export default LobbyReadyButtons;
