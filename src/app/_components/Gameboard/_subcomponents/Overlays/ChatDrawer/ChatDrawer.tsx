import React, { forwardRef } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';

const ChatDrawer = forwardRef<HTMLDivElement, IChatDrawerProps>(
    function ChatDrawer(
        {
            sidebarOpen,
            toggleSidebar,
        }
    ) {
        // we need to set the chatHistory to correct format so we use gameState.gameChat
        const { gameState } = useGame();

        // ------------------------STYLES------------------------//

        const drawerStyle = {
            flexShrink: 0,
            width: '300px',
            '& .MuiDrawer-paper': {
                backgroundColor: '#000000CC',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '300px',
            },
        };
        const headerBoxStyle = {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        };

        return (
            <Drawer
                anchor="right"
                open={sidebarOpen}
                onClose={toggleSidebar}
                variant="persistent"
                sx={drawerStyle}
            >
                <Box sx={{ p: 2 }}>
                    <Box sx={headerBoxStyle}>
                        <Typography variant="h3" sx={{ m: 0 }}>
                            ROUND
                        </Typography>
                    </Box>

                    {/* Use the ChatComponent here */}
                    <Chat
                        chatHistory={gameState.messages}
                    />
                </Box>
            </Drawer>
        );
    }
);

export default ChatDrawer;
