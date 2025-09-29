import React, { useState } from 'react';
import { Drawer, Box, Button } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UndoIcon from '@mui/icons-material/Undo';
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
    const handleUndoButton = () => {
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
            height: '1.5em',
        },
        quickUndo:{
            height:'45px',
            mb:'10px',
            width: 'min(55%, 200px)',
            lineHeight: '1.2',
        },
        quickUndoBox:{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: '0.5em',
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
            </Box>

            {(isDev || gameState.undoEnabled) && (<Box sx={styles.quickUndoBox}>
                <Image
                    src="/porg1.png"
                    alt="Highlighted Stats Panel"
                    width={50}
                    height={50}
                    style={{
                        position:'absolute',
                        left:'53px',
                        top:'22px',
                        visibility: isUndoHovered ? 'visible' : 'hidden',
                    }}
                />
                <Button
                    variant="contained"
                    onClick={handleUndoButton}
                    onMouseEnter={() => setIsUndoHovered(true)}
                    onMouseLeave={() => setIsUndoHovered(false)}
                    disabled={!correctPlayer['availableSnapshots']?.hasQuickSnapshot}
                    startIcon={<UndoIcon />}
                    sx={{
                        ...styles.quickUndo,
                        background: 'linear-gradient(rgb(29, 29, 29), #0a3d1e) padding-box, linear-gradient(to top, #1cb34a, #0a3d1e) border-box',
                        color: '#FFF',
                        fontSize: '20px',
                        border: '1px solid transparent',
                        borderRadius: '10px',
                        pt: '10px',
                        pb: '10px',
                        justifyContent: 'space-between',
                        paddingLeft: '12px',
                        paddingRight: '35px',
                        position: 'relative',
                        '& .MuiButton-startIcon': {
                            marginRight: 0,
                            marginLeft: 0,
                            transform: 'skewX(5deg)',
                            '& svg': {
                                width: '23px',
                                height: '23px',
                            },
                        },
                        '&:hover': {
                            background: 'linear-gradient(rgb(29, 29, 29),rgb(20, 81, 40)) padding-box, linear-gradient(to top, #2ad44c, #0a3d1e) border-box',
                            boxShadow: '0 0 8px rgba(0, 170, 70, 0.7)',
                            border: '1px solid rgba(0, 200, 90, 0.7)',
                        },
                        '&:disabled': {
                            backgroundColor: '#404040',
                            color: '#FFF'
                        },
                        transform: 'skewX(-5deg)',
                    }}
                >
                    Undo
                </Button>
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
