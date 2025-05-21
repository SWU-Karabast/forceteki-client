import React, { useState, useEffect } from 'react';
import {
    Card,
    Typography,
    Box, 
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import SetUpCard from '@/app/_components/Lobby/_subcomponents/SetUpCard/SetUpCard';
import { useGame } from '@/app/_contexts/Game.context';
import { useUser } from '@/app/_contexts/User.context';
import { useRouter } from 'next/navigation';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import ChatIcon from '@mui/icons-material/Chat';
import BlockIcon from '@mui/icons-material/Block';

const SetUp: React.FC = ({
}) => {
    const router = useRouter();
    const { lobbyState, sendLobbyMessage, connectedPlayer, sendMessage } = useGame();
    const { user } = useUser();
    
    // find the user
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    // setup chat mechanics
    const [chatMessage, setChatMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    
    // Initialize mute state from user preferences
    useEffect(() => {
        if (user?.preferences?.muteChat !== undefined) {
            setIsMuted(user.preferences.muteChat);
        }
    }, [user?.preferences?.muteChat]);
    
    const toggleMute = () => {
        const newMuteState = !isMuted;
        setIsMuted(newMuteState);
        
        // Update user preferences if authenticated
        if (user) {
            // Update in-memory preferences
            user.preferences.muteChat = newMuteState;
            
            // Store in localStorage for dev environment
            const storedUser = localStorage.getItem('devUser');
            if (storedUser) {
                const currentPrefs = user.preferences || {};
                localStorage.setItem(`${storedUser}_preferences`, JSON.stringify({
                    ...currentPrefs,
                    muteChat: newMuteState
                }));
            }
        }
    };
    
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
            <SetUpCard owner={lobbyState ? lobbyState.lobbyOwnerId === connectedPlayer : false} readyStatus={connectedUser ? connectedUser.ready : false}/>
            <Card sx={styles.mainCardStyle}>
                <Box sx={{ position: 'relative' }}>
                    <Tooltip title={isMuted ? 'Show Player Messages' : 'Hide Player Messages'}>
                        <IconButton 
                            onClick={toggleMute}
                            size="small"
                            sx={{ 
                                color: isMuted ? '#ff5252' : '#4caf50',
                                position: 'absolute',
                                right: '5px',
                                top: '12px',
                                zIndex: 1,
                                padding: '6px',
                                backgroundColor: isMuted ? 'rgba(255, 82, 82, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                                '&:hover': {
                                    backgroundColor: isMuted ? 'rgba(255, 82, 82, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                }
                            }}
                        >
                            {isMuted ? (
                                <div style={{ position: 'relative', display: 'inline-flex' }}>
                                    <ChatIcon fontSize="small" />
                                    <BlockIcon fontSize="small" style={{ 
                                        position: 'absolute', 
                                        top: -2, 
                                        right: -2, 
                                        fontSize: '1rem' 
                                    }} />
                                </div>
                            ) : (
                                <ChatIcon />
                            )}
                        </IconButton>
                    </Tooltip>
                    <Chat
                        chatHistory={lobbyState ? lobbyState.gameChat?.messages : []}
                        chatMessage={chatMessage}
                        setChatMessage={setChatMessage}
                        handleChatSubmit={handleChatSubmit}
                        muteChat={isMuted}
                    />
                </Box>
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
