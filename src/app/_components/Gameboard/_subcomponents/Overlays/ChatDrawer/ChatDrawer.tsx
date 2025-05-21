import React, { useState, useEffect } from 'react';
import { Drawer, Box, Typography, IconButton, Tooltip } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { useUser } from '@/app/_contexts/User.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatIcon from '@mui/icons-material/Chat';
import BlockIcon from '@mui/icons-material/Block';

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar }) => {
    const { gameState, sendGameMessage } = useGame();
    const { user } = useUser();
    const [chatMessage, setChatMessage] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    
    // Initialize mute state from user preferences
    useEffect(() => {
        if (user?.preferences?.muteChat !== undefined) {
            setIsMuted(user.preferences.muteChat);
        }
    }, [user?.preferences?.muteChat]);

    const handleGameChat = () => {
        const trimmed = chatMessage.trim();
        if (!trimmed) return; // don't send empty messages
        sendGameMessage(['chat', trimmed]);
        setChatMessage('');
    }
    
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
    }

    // ------------------------STYLES------------------------//
    const styles = {
        drawerStyle: {
            flexShrink: 0,
            '& .MuiDrawer-paper': {
                backgroundColor: '#000000CC',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                width: 'min(20%, 280px)',
                padding: '0.75em',
                overflow: 'hidden',
            },
        },
        headerBoxStyle: {
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            height: '2.5em',
        }
    }

    

    return (
        <Drawer
            anchor="right"
            open={sidebarOpen}
            variant="persistent"
            sx={styles.drawerStyle}
        >
            <Box sx={styles.headerBoxStyle}>
                <ChevronRightIcon 
                    onClick={toggleSidebar} 
                    sx={{ cursor: 'pointer' }}
                />
                <Typography sx={{
                    fontWeight: 'bold',
                    color: '#fff',
                    fontSize: '1.5em',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'max-content',
                }}>Chat</Typography>
                <Tooltip title={isMuted ? "Show Player Messages" : "Hide Player Messages"}>
                    <IconButton 
                        onClick={toggleMute}
                        size="small"
                        sx={{ 
                            color: isMuted ? '#ff5252' : '#4caf50',
                            position: 'absolute',
                            right: '5px',
                            top: '1px',
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
            </Box>

            {/* Use the ChatComponent here */}
            <Chat
                chatHistory={gameState.messages}
                chatMessage={chatMessage}
                setChatMessage={setChatMessage}
                handleChatSubmit={handleGameChat}
                muteChat={isMuted}
            />
        </Drawer>
    );
};

export default ChatDrawer;
