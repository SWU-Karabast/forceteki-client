import React from 'react';
import { Box, Button, CardActions, Typography } from '@mui/material';
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
    readyImg: (ready: boolean) => ({
        width: '15px',
        height: '15px',
        backgroundImage: `url(${ready ? '/ready.png' : '/notReady.png'})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        marginTop: '7px',
        marginRight: '5px'
    }),
    buttonsContainerStyle: {
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
    },
};

function LobbyReadyButtons({ readyStatus, isOwner, blockError = false, hasDeck = true }: ILobbyReadyButtonsProps) {
    const { sendLobbyMessage, lobbyState, connectedPlayer } = useGame();

    const opponentUser = lobbyState?.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer);
    const opponentReady = opponentUser?.ready || false;
    const bothReady = readyStatus && opponentReady;

    // Bo3 detection: check if we're in a Bo3 game after the first game
    const winHistory = lobbyState?.winHistory;
    const isBo3Mode = winHistory?.gamesToWinMode === GamesToWinMode.BestOfThree;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const isBo3AfterFirstGame = isBo3Mode && currentGameNumber > 1;

    const handleReadyClick = () => {
        sendLobbyMessage(['setReadyStatus', !readyStatus]);
    };

    const handleStartGame = () => {
        sendLobbyMessage(['startGameAsync']);
    };

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
                <Box sx={styles.readyImg(readyStatus)} />
                <Typography variant="h6" sx={{ marginTop: '6px' }}>
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
                    <Box sx={styles.readyImg(readyStatus)} />
                    <Typography variant="h6" sx={{ marginTop: '6px' }}>
                        Both players are ready.
                    </Typography>
                </Box>
                <CardActions sx={styles.buttonsContainerStyle}>
                    <Button variant="contained" onClick={handleStartGame}>
                        Start Game
                    </Button>
                    <Button variant="contained" onClick={handleReadyClick}>
                        {readyStatus ? 'Unready' : 'Ready'}
                    </Button>
                </CardActions>
            </>
        );
    }

    // Not both ready - show ready toggle button
    return (
        <CardActions sx={styles.buttonsContainerStyle}>
            <Box sx={styles.readyImg(readyStatus)} />
            <Button
                disabled={blockError}
                variant="contained"
                onClick={handleReadyClick}
            >
                {readyStatus ? 'Unready' : 'Ready'}
            </Button>
        </CardActions>
    );
}

export default LobbyReadyButtons;
