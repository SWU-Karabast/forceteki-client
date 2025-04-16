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
        if (chatMessage.trim()) {
            sendGameMessage(['chat', chatMessage]);
            setChatMessage('');
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
                width: '280px',
                padding: '1em',
                overflow: 'hidden',
            },
        },
        headerBoxStyle: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }
    }

    

    return (
        <Drawer
            anchor="right"
            open={sidebarOpen}
            variant="persistent"
            sx={styles.drawerStyle}
        >
            <ChevronRightIcon onClick={toggleSidebar} />
            <Box sx={styles.headerBoxStyle}>
                {/* <Typography variant="h3">
                    ROUND
                </Typography> */}
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
