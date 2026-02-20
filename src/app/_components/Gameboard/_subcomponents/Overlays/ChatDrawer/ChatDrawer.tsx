import React, { useState } from 'react';
import { Drawer, Box, Button } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UndoIcon from '@mui/icons-material/Undo';
import MessageIcon from '@mui/icons-material/Message';
import BlockIcon from '@mui/icons-material/Block';
import Image from 'next/image';
import { QuickUndoAvailableState } from '@/app/_constants/constants';
import { useChatTypingState } from '@/app/_hooks/useChatTypingState';

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar }) => {
    const { gameState, gameMessages, sendGameMessage, connectedPlayer, isSpectator } = useGame();
    const { handleTypingStateOnChange, resetTypingState } = useChatTypingState();
    const [chatMessage, setChatMessage] = useState('')
    const [isUndoHovered, setIsUndoHovered] = useState(false);
    const isDev = process.env.NODE_ENV === 'development';
    const correctPlayer = gameState.players[connectedPlayer];

    const quickUndoState: QuickUndoAvailableState | null = correctPlayer?.availableSnapshots?.quickSnapshotAvailable;

    const handleChatOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        handleTypingStateOnChange(event.target.value);
        setChatMessage(event.target.value);
    }

    const handleGameChat = () => {
        const trimmed = chatMessage.trim();
        if (!trimmed) return; // don't send empty messages
        sendGameMessage(['chat', trimmed]);
        setChatMessage('');
        resetTypingState();
    }
    const handleUndoButton = () => {
        sendGameMessage(['rollbackToSnapshot',{
            type: 'quick',
            playerId: connectedPlayer,
            actionOffset: 0
        }])
    }

    // ------------------------STYLES------------------------//
    const quickUndoButtonBase = {
        height:'45px',
        mb:'10px',
        lineHeight: '1.2',
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
            display: { xs: 'none', sm: 'none', md: 'block' },
            '& svg': {
                width: '23px',
                height: '23px',
            },
        },
        transform: 'skewX(-5deg)',
    };

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
        quickUndoBox:{
            display: 'inline-flex',
            justifyContent: 'flex-start',
            paddingLeft: '0.5em',
        },
        quickUndoButtonEnabled: {
            ...quickUndoButtonBase,
            width: 'min(55%, 200px)',
            background: 'linear-gradient(rgb(29, 29, 29), #0a3d1e) padding-box, linear-gradient(to top, #1cb34a, #0a3d1e) border-box',
            '&:hover': {
                background: 'linear-gradient(rgb(29, 29, 29),rgb(20, 81, 40)) padding-box, linear-gradient(to top, #2ad44c, #0a3d1e) border-box',
                boxShadow: '0 0 8px rgba(0, 170, 70, 0.7)',
                border: '1px solid rgba(0, 200, 90, 0.7)',
            },
        },
        quickUndoButtonDisabled: {
            ...quickUndoButtonBase,
            width: 'min(55%, 200px)',
            '&:disabled': {
                backgroundColor: '#404040',
                color: '#FFF'
            },
        },
        quickUndoButtonBlocked: {
            ...quickUndoButtonBase,
            width: 'min(65%, 240px)',
            '&:disabled': {
                backgroundColor: '#404040',
                color: '#FFF'
            },
        },
        quickUndoButtonRequest: {
            ...quickUndoButtonBase,
            width: 'min(65%, 240px)',
            background: 'linear-gradient(#1E2D32, #1E2D32) padding-box, linear-gradient(#404040, #008FC4) border-box',
            '&:hover': {
                background: 'linear-gradient(#2C4046, #2C4046) padding-box, linear-gradient(#404040, #008FC4) border-box',
            },
        }
    }

    let undoButtonDisabled;
    switch (quickUndoState) {
        case QuickUndoAvailableState.NoSnapshotAvailable:
        case QuickUndoAvailableState.UndoRequestsBlocked:
        case QuickUndoAvailableState.WaitingForConfirmation:
            undoButtonDisabled = true;
            break;
        default:
            undoButtonDisabled = false;
            break;
    }

    let undoButtonStyle;
    switch (quickUndoState) {
        case QuickUndoAvailableState.FreeUndoAvailable:
            undoButtonStyle = styles.quickUndoButtonEnabled;
            break;
        case QuickUndoAvailableState.UndoRequestsBlocked:
        case QuickUndoAvailableState.WaitingForConfirmation:
            undoButtonStyle = styles.quickUndoButtonBlocked;
            break;
        case QuickUndoAvailableState.RequestUndoAvailable:
            undoButtonStyle = styles.quickUndoButtonRequest;
            break;
        default:
            undoButtonStyle = styles.quickUndoButtonDisabled;
            break;
    }

    let buttonText;
    switch (quickUndoState) {
        case QuickUndoAvailableState.RequestUndoAvailable:
            buttonText = 'Request';
            break;
        case QuickUndoAvailableState.UndoRequestsBlocked:
            buttonText = 'Blocked';
            break;
        case QuickUndoAvailableState.WaitingForConfirmation:
            buttonText = 'Waiting';
            break;
        default:
            buttonText = 'Undo';
            break;
    }

    let buttonIcon;
    switch (quickUndoState) {
        case QuickUndoAvailableState.RequestUndoAvailable:
            buttonIcon = <MessageIcon />;
            break;
        case QuickUndoAvailableState.UndoRequestsBlocked:
        case QuickUndoAvailableState.WaitingForConfirmation:
            buttonIcon = <BlockIcon />;
            break;
        default:
            buttonIcon = <UndoIcon />;
            break;
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

            {(isDev || gameState.undoEnabled) && (!isSpectator) && (<Box sx={styles.quickUndoBox}>
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
                <Button
                    variant="contained"
                    onClick={handleUndoButton}
                    onMouseEnter={() => setIsUndoHovered(true)}
                    onMouseLeave={() => setIsUndoHovered(false)}
                    disabled={undoButtonDisabled}
                    startIcon={buttonIcon}
                    sx={undoButtonStyle}
                >
                    {buttonText}
                </Button>
            </Box>)}

            {/* Use the ChatComponent here */}
            <Chat
                chatHistory={gameMessages}
                chatMessage={chatMessage}
                handleChatOnChange={handleChatOnChange}
                handleChatSubmit={handleGameChat}
            />
            
        </Drawer>
    );
};

export default ChatDrawer;
