import React, { useState } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar }) => {
    const { gameState, sendGameMessage } = useGame();
    const [chatMessage, setChatMessage] = useState('')

    const handleGameChat = () => {
        const trimmed = chatMessage.trim();
        if (!trimmed) return; // don't send empty messages
        sendGameMessage(['chat', trimmed]);
        setChatMessage('');
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
                <ChevronRightIcon onClick={toggleSidebar} />
                <Typography sx={{
                    color: '#fff',
                    fontSize: '1.5em',
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'max-content',
                }}>Chat</Typography>
            </Box>

            {/* Use the ChatComponent here */}
            <Chat
                chatHistory={gameState.messages}
                chatMessage={chatMessage}
                setChatMessage={setChatMessage}
                handleChatSubmit={handleGameChat}
            />
        </Drawer>
    );
};

export default ChatDrawer;
