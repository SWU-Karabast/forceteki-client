import React, { useState } from 'react';
import {
    Card,
    Typography,
    Box, Divider,
} from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import DeckSelectionCard from '@/app/_components/Lobby/_subcomponents/DeckSelectionCard/DeckSelectionCard';
import Bo3ScoreCard from '@/app/_components/Lobby/_subcomponents/Bo3ScoreCard/Bo3ScoreCard';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation'
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { GamesToWinMode } from '@/app/_constants/constants';

const SetUp: React.FC = ({
}) => {
    const router = useRouter();
    const { lobbyState, sendLobbyMessage, connectedPlayer, sendMessage } = useGame();

    // find the user
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    
    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    
    // Determine if we should show Bo3ScoreCard (Bo3 mode and game 2+)
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const showBo3ScoreCard = isBo3Mode && currentGameNumber > 1;
    
    // setup chat mechanics
    const [chatMessage, setChatMessage] = useState('');
    
    const handleChatSubmit = () => {
        if (chatMessage.trim()) {
            sendLobbyMessage(['sendChatMessage',chatMessage]);
            setChatMessage('');
        }
    };

    const handleExit = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    }

    // ------------------------STYLES------------------------//
    const styles = {
        mainCardStyle: {
            borderRadius: '1.1em',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            mt: '2.0em',
            p: '1.8em',
            backgroundColor: '#00000080',
            backdropFilter: 'blur(30px)',
            overflow: 'auto',
            flex: 1,
        },
        lobbyTextStyle:{
            fontSize: '3.0em',
            fontWeight: '600',
            color: 'white',
            alignSelf: 'flex-start',
            mb: '0.3em',
        },
        exitCard: {
            display: 'flex',
            p: '1.2em',
            width: '100%',
            height: '10%',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            '&:hover': { opacity: '0.8' },
        },
        dividerStyle: {
            backgroundColor: '#fff',
            mt: '.5vh',
            mb: '0.5vh',
        },
        boxContainer: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
    }

    return (
        <Box sx={styles.boxContainer}>
            <Typography sx={styles.lobbyTextStyle}>KARABAST</Typography>
            {showBo3ScoreCard ? (
                <Bo3ScoreCard 
                    owner={lobbyState ? lobbyState.lobbyOwnerId === connectedPlayer : false} 
                    readyStatus={connectedUser ? connectedUser.ready : false}
                />
            ) : (
                <DeckSelectionCard 
                    owner={lobbyState ? lobbyState.lobbyOwnerId === connectedPlayer : false} 
                    readyStatus={connectedUser ? connectedUser.ready : false}
                />
            )}
            <Card sx={styles.mainCardStyle}>
                <Chat
                    chatHistory={lobbyState ? lobbyState.gameChat?.messages : []}
                    chatMessage={chatMessage}
                    setChatMessage={setChatMessage}
                    handleChatSubmit={handleChatSubmit}
                />
                <Divider sx={styles.dividerStyle} />
                <Box sx={styles.exitCard} onClick={() => handleExit()}>
                    <Typography variant="h5">
                        Exit Game Lobby
                    </Typography>
                    <Typography variant="h5">
                        {'<'}
                    </Typography>
                </Box>
            </Card>
        </Box>
    );
};

export default SetUp;
