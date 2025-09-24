import React, { useState } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UndoIcon from '@mui/icons-material/Undo';
import MenuIcon from '@mui/icons-material/Menu';
import ChatButtonComponent from '@/app/_components/Gameboard/_subcomponents/Overlays/ChatDrawer/_subComponents/ChatButtonComponent';
import PhaseUndoDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PhaseUndoDialog';
import Image from 'next/image';

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar }) => {
    const { gameState, sendGameMessage, connectedPlayer } = useGame();
    const [chatMessage, setChatMessage] = useState('')
    const [isUndoHovered, setIsUndoHovered] = useState(false);
    const [phaseUndoOpen, setPhaseUndoOpen] = useState(false);
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

    const handleOpenPhaseUndoModal = () => {
        setPhaseUndoOpen(true);
    }

    const handleClosePhaseUndoModal = () => {
        setPhaseUndoOpen(false);
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
            height:'45px',
            mb:'10px',
            width: 'min(55%, 200px)',
            lineHeight: '1.2',
        },
        quickUndoBox:{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
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
            {(isDev || gameState.undoEnabled) && (<Box sx={styles.quickUndoBox}>
                <Image
                    src="/porg1.png"
                    alt="Highlighted Stats Panel"
                    width={50}
                    height={50}
                    style={{
                        position:'absolute',
                        right:'10px',
                        top:'10px',
                        visibility: isUndoHovered ? 'visible' : 'hidden',
                    }}
                />
                <ChatButtonComponent 
                    sx={styles.quickUndo} 
                    buttonFnc={handleUndoButton} 
                    variant={'standard'} 
                    text={'Undo'}
                    startIcon={<UndoIcon />}
                    onMouseEnter={() => setIsUndoHovered(true)}
                    onMouseLeave={() => setIsUndoHovered(false)}
                    disabled={!correctPlayer['availableSnapshots']?.hasQuickSnapshot}
                />
                <ChatButtonComponent 
                    sx={styles.quickUndo} 
                    buttonFnc={handleOpenPhaseUndoModal} 
                    variant={'standard'} 
                    text={<>Previous<br/>Phase</>}
                    startIcon={<MenuIcon />}
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
            
            {/* Phase Undo Dialog */}
            <PhaseUndoDialog
                open={phaseUndoOpen}
                onClose={handleClosePhaseUndoModal}
            />
        </Drawer>
    );
};

export default ChatDrawer;
