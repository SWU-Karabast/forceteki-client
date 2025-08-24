import React, { useState } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import Image from 'next/image';

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar }) => {
    const { gameState, sendGameMessage, connectedPlayer } = useGame();
    const [chatMessage, setChatMessage] = useState('')
    const [isUndoHovered, setIsUndoHovered] = useState(false);
    const isDev = process.env.NODE_ENV === 'development';
    const correctPlayer = gameState.players[connectedPlayer];
    const handleGameChat = () => {
        const trimmed = chatMessage.trim();
        if (!trimmed) return; // don't send empty messages
        sendGameMessage(['chat', trimmed]);
        setChatMessage('');
    }
    const handleUndo = () => {
        sendGameMessage(['rollbackToSnapshot',{
            type: 'quick',
            playerId: connectedPlayer,
            actionOffset: 0
        }])
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
        },
        quickUndo:{
            height:'50px',
            mr:'30px',
            width: 'min(50%, 280px)',
        },
        quickUndoBox:{
            display: 'flex',
            justifyContent:'center',
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
            {isDev && (<Box sx={styles.quickUndoBox}>
                <Image
                    src="/porg1.png"
                    alt="Highlighted Stats Panel"
                    width={50}
                    height={50}
                    style={{
                        position:'relative',
                        left:'35px',
                        bottom:'28px',
                        visibility: isUndoHovered ? 'visible' : 'hidden',
                    }}
                />
                <PreferenceButton sx={styles.quickUndo} buttonFnc={handleUndo} variant={'standard'} text={'Quick Undo'}
                    onMouseEnter={() => setIsUndoHovered(true)}
                    onMouseLeave={() => setIsUndoHovered(false)}
                    disabled={!correctPlayer['availableSnapshots']?.hasQuickSnapshot}
                />
            </Box>)}

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
