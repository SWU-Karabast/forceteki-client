'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { useRouter } from 'next/navigation'
import { LeaderBaseCardStyle } from '../../_sharedcomponents/Cards/CardTypes';
import { useUser } from '@/app/_contexts/User.context';
import { useSoundHandler } from '@/app/_hooks/useSoundHandler';


const FoundGame: React.FC = () => {
    const { lobbyState, connectedPlayer, gameState } = useGame();
    const { user } = useUser();
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;
    // set connectedPlayer
    const playerLeader = connectedUser?.deck?.leader;
    const playerBase = connectedUser?.deck?.base;
    // set opponent
    const titleOpponent = opponentUser ? opponentUser.username : null;
    const opponentLeader = opponentUser ? opponentUser.deck.leader : null;
    const opponentBase = opponentUser ? opponentUser.deck.base : null;
    const router = useRouter();
    const [countdownText, setCountdownText] = useState('Connecting...');

    const hasPlayedSoundRef = useRef(false);
    // Initialize sound handler with user preferences
    const { playFoundOpponentSound } = useSoundHandler({
        enabled: true,
        user
    });

    useEffect(() => {
        if (gameState) {
            router.push('/GameBoard');
        } else {
            setCountdownText(lobbyState.matchingCountdownText);
            router.push('/quickGame');
        }
    }, [router, gameState, lobbyState]);

    useEffect(() => {
        if (!hasPlayedSoundRef.current) {
            playFoundOpponentSound();
            hasPlayedSoundRef.current = true;
        }
    }, [playFoundOpponentSound]);


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
        parentBoxStyling: {
            position:'absolute',
            display:'flex',
            width:'100%',
            justifyContent:'center'
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
        },
        baseParent:{
            display:'flex',
            justifyContent: 'center',
        }
    };

    return (
        <Card sx={styles.searchBox}>
            <Box>
                <Typography sx={styles.connectingText}>
                    Match found!
                </Typography>
                <Typography sx={styles.playerText}>{countdownText}</Typography>
            </Box>
            <Box sx={styles.playersContainer}>
                <Box sx={styles.CardSetContainerStyle}>
                    <Box sx={styles.baseParent}>
                        <LeaderBaseCard card={playerBase}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <LeaderBaseCard card={playerLeader} cardStyle={LeaderBaseCardStyle.PlainLeader} isLeader={true}/>
                    </Box>
                    <Typography sx={{ ...styles.playerText, marginTop:'24px' }}>
                        {connectedUser?.username}
                    </Typography>
                </Box>
                <Typography sx={{ ...styles.connectingText, display:'flex',alignItems:'center' }}>
                    Vs
                </Typography>
                <Box sx={styles.CardSetContainerStyle}>
                    <Box sx={styles.baseParent}>
                        <LeaderBaseCard card={opponentBase}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <LeaderBaseCard card={opponentLeader} cardStyle={LeaderBaseCardStyle.PlainLeader} isLeader={true}/>
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