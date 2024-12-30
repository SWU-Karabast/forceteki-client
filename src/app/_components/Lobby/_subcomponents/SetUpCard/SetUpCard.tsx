import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Box, CardActions,
} from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation'
import { ILobbyUserProps, ISetUpProps } from '@/app/_components/Lobby/LobbyTypes';

const SetUpCard: React.FC<ISetUpProps> = ({
    readyStatus,
    owner,
}) => {
    const { sendMessage, lobbyState, connectedPlayer, sendLobbyMessage } = useGame();
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    // Extract the player from the URL query params
    const router = useRouter();

    // ------------------------Additional functions------------------------//
    const handleStartGame = async () => {
        sendMessage('startGame');
        router.push('/GameBoard');
    };

    // ------------------------STYLES------------------------//
    const styles = {
        setUpCard: {
            paddingLeft: '20px',
            paddingRight: '20px',
        },
        readyImg: {
            width: '15px',
            height: '15px',
            backgroundImage: `url(${readyStatus ? '/ready.png' : '/notReady.png'})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            marginTop: '7px',
            marginRight: '5px'
        },
        cardStyle: {
            height: 'fit-content',
            background: '#18325199',
            pb: '4vh',
            backgroundColor: '#000000E6',
            backdropFilter: 'blur(20px)',
        },
        textFieldStyle: {
            backgroundColor: '#fff2',
            '& .MuiInputBase-input': {
                color: '#fff',
            },
            '& .MuiInputBase-input::placeholder': {
                color: '#fff',
            },
        },
        boxStyle: {
            display: 'flex',
            justifyContent: 'flex-end',
            mt: '1em',
        },
        buttonStyle: {
            backgroundColor: '#292929',
            minWidth: '9rem',
        },
        initiativeCardStyle: {
            height: '15vh',
            minHeight: '8.5rem',
            background: '#18325199',
            display: 'flex',
            paddingLeft: '30px',
            paddingRight: '30px',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        buttonsContainerStyle: {
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
        },
        setUpTextStyle: {
            fontSize: '1.5em',
            fontWeight: '800',
            color: 'white',
            alignSelf: 'flex-start',
        },
    }
    return (
        <Card sx={styles.initiativeCardStyle}>
            <Typography variant="h3" sx={styles.setUpTextStyle}>
                Set Up
            </Typography>
            {!opponentUser ? (
            // If opponent is null, show "Waiting for an opponent" UI
                <CardContent sx={styles.setUpCard}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ marginTop: '6px' }}>
                            Waiting for an opponent to join
                        </Typography>
                    </Box>
                    <Box sx={styles.boxStyle}>
                        <TextField fullWidth sx={styles.textFieldStyle} placeholder="https://properlink.com" />
                        <Button variant="contained" sx={styles.buttonStyle}>Copy Invite Link</Button>
                    </Box>
                </CardContent>
            ) : (
            // If opponent is not null
                <>
                    {readyStatus && opponentUser.ready && owner ? (

                    /* Both are ready */
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box sx={styles.readyImg} />
                                <Typography variant="h6" sx={{ marginTop: '6px' }}>
                                    Both players are ready.
                                </Typography>
                            </Box>
                            <CardActions sx={styles.buttonsContainerStyle}>
                                <Button variant="contained" onClick={() => handleStartGame()}>
                                    Start Game
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => sendLobbyMessage(['setReadyStatus', !readyStatus])}
                                >
                                    {readyStatus ? 'Unready' : 'Ready'}
                                </Button>
                            </CardActions>
                        </>
                    ) : (

                    /* Not both ready — show toggle-ready button */
                        <CardActions sx={styles.buttonsContainerStyle}>
                            <Box sx={styles.readyImg} />
                            <Button
                                variant="contained"
                                onClick={() => sendLobbyMessage(['setReadyStatus', !readyStatus])}
                            >
                                {readyStatus ? 'Unready' : 'Ready'}
                            </Button>
                        </CardActions>
                    )}
                </>
            )}
        </Card>
    );
};

export default SetUpCard;
