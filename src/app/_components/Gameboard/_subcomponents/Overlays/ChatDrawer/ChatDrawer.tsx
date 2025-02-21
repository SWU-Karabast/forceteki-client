import React from 'react';
import { Drawer, Box, IconButton, Typography } from '@mui/material';
import { Settings, Close } from '@mui/icons-material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen }) => {
    const { gameState } = useGame();

    // ------------------------STYLES------------------------//

    const drawerStyle = {
        flexShrink: 0,
        '& .MuiDrawer-paper': {
            backgroundColor: '#000000CC',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '280px',
        },
    };
    const headerBoxStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    };

    const imagePlaceholderBoxStyle = {
        backgroundColor: '#333',
        height: '150px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    return (
        <Drawer
            anchor="right"
            open={sidebarOpen}
            variant="persistent"
            sx={drawerStyle}
        >
            <Box sx={{ p: 2 }}>
                <Box sx={headerBoxStyle}>
                    <Typography variant="h3" sx={{ m: 0 }}>
                        ROUND
                    </Typography>
                </Box>

                <Box sx={{ mt: 1 }}>
                    <Typography style={{ fontWeight: 'bold' }}>Last Played</Typography>
                    <Box sx={imagePlaceholderBoxStyle}>
                        <Typography style={{ color: '#888' }}>
                            Image Placeholder
                        </Typography>
                    </Box>
                </Box>

                {/* Use the ChatComponent here */}
                <Chat
                    chatHistory={gameState.gameChat}
                />
            </Box>
        </Drawer>
    );
};

export default ChatDrawer;
