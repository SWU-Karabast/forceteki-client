'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard/LeaderBaseCard';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { useRouter } from 'next/navigation'


const FoundGame: React.FC = () => {
    const { lobbyState, connectedPlayer, sendLobbyMessage, gameState } = useGame();
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    const lobbyOwner = lobbyState.lobbyOwnerId
    // set connectedPlayer
    const playerLeader = connectedUser ? connectedUser.deck.leader[0].card : null;
    const playerBase = connectedUser ? connectedUser.deck.base[0].card : null;

    // set opponent
    const titleOpponent = opponentUser ? opponentUser.username : null;
    const opponentLeader = opponentUser ? opponentUser.deck.leader[0].card : null;
    const opponentBase = opponentUser ? opponentUser.deck.base[0].card : null;
    const router = useRouter();

    // --- Countdown State ---
    const [countdown, setCountdown] = useState(5);
    const [gameStartSent, setGameStart] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCountdown((prev) => Math.max(prev - 1, 0));
        }, 1000);

        // Cleanup the timer when the component unmounts
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (countdown !== 0) return;

        if (gameState) {
            router.push('/GameBoard');
        }

        // Only run once—if the connected user is the lobby owner and game start hasn't been sent yet
        if (connectedUser?.id === lobbyOwner && !gameStartSent) {
            setGameStart(true);
            sendLobbyMessage(['onStartGame']);
        }
    }, [countdown, connectedUser?.id, lobbyOwner, sendLobbyMessage, router, gameState, gameStartSent]);

    // ------------------------STYLES------------------------//

    const styles = {
        searchBox: {
            width: '41.875rem',
            height: '30.375rem',
            backgroundColor: '#122237',
            border: '3px solid #122237',
            borderRadius: '15px',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        connectingText: {
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: '600',
            fontSize: '2.0em',
            textAlign: 'center',
        },
        playerText: {
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: '600',
            fontSize: '1.5em',
            textAlign: 'center',
        },
        buttonsContainerStyle: {
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
        },
        readyImg: {
            width: '15px',
            height: '15px',
            backgroundImage: 'url(/ready.png)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            marginTop: '7px',
            marginRight: '5px'
        },
        boxGeneralStyling: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width: '14rem',
            height: '10.18rem',
            backgroundImage: 'url(/leaders/boba.webp)',
            backgroundRepeat: 'no-repeat',
            textAlign: 'center' as const,
            color: 'white',
            display: 'flex',
            cursor: 'pointer',
            position: 'relative' as const,
            mb: '10px',
        },
        parentBoxStyling: {
            position:'absolute',
        },
        CardSetContainerStyle:{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            width: '14.2rem',
            height: '12.1rem',
        },
        playersContainer:{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            height: '12.1rem',
            paddingLeft: '15px',
            marginTop:'20px'
        }
    };

    return (
        <Card sx={styles.searchBox}>
            <Box>
                <Typography sx={styles.connectingText}>
                    Match found!
                </Typography>
                <Typography sx={styles.playerText}>Starts in {countdown}</Typography>
            </Box>
            <Box sx={styles.playersContainer}>
                <Box sx={styles.CardSetContainerStyle}>
                    <Box>
                        <LeaderBaseCard isLobbyView={true} size={'large'} variant={'base'} card={playerBase}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <LeaderBaseCard isLobbyView={true} size={'large'} variant={'leader'} card={playerLeader}/>
                    </Box>
                    <Typography sx={{ ...styles.playerText, marginTop:'24px' }}>
                        {connectedUser.username}
                    </Typography>
                </Box>
                <Typography sx={{ ...styles.connectingText, display:'flex',alignItems:'center' }}>
                    Vs
                </Typography>
                <Box sx={styles.CardSetContainerStyle}>
                    <Box>
                        <LeaderBaseCard isLobbyView={true} size={'large'} variant={'base'} card={opponentBase}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <LeaderBaseCard isLobbyView={true} size={'large'} variant={'leader'} card={opponentLeader}/>
                    </Box>
                    <Typography sx={{ ...styles.playerText, marginTop:'24px' }}>
                        {titleOpponent}
                    </Typography>
                </Box>
            </Box>
        </Card>
    );
};

export default FoundGame;