import React, { useState } from 'react';
import { Drawer, Box, Button, IconButton, Tooltip } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import UndoIcon from '@mui/icons-material/Undo';
import MessageIcon from '@mui/icons-material/Message';
import BlockIcon from '@mui/icons-material/Block';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { QuickUndoAvailableState } from '@/app/_constants/constants';
import { useChatTypingState } from '@/app/_hooks/useChatTypingState';

// ------------------------STYLES------------------------//
const quickUndoButtonBase = {
    height: { xs: '40px', md: '45px' },
    mb: 0,
    lineHeight: '1.2',
    color: '#FFF',
    fontSize: { xs: '0.9rem', md: '20px' },
    fontWeight: 700,
    border: '1px solid transparent',
    borderRadius: '10px',
    py: { xs: '6px', md: '10px' },
    justifyContent: 'space-between',
    pl: { xs: '14px', md: '12px' },
    pr: { xs: '18px', md: '35px' },
    position: 'relative',
    textTransform: 'none',
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
            width: { xs: '200px', md: 'min(20%, 280px)' },
            padding: { xs: '0.6em', md: '0.85em' },
            overflow: 'hidden',
        },
    },
    matchActions: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1,
        py: { xs: 0.75, md: 1 },
        mb: { xs: 1, md: 1.25 },
    },
    quickUndoBox: {
        display: 'flex',
        justifyContent: 'flex-start',
        flex: '1 1 auto',
        minWidth: 0,
    },
    actionIconGroup: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: { xs: 0.75, md: 1 },
        flex: '0 0 auto',
    },
    quickUndoButtonEnabled: {
        ...quickUndoButtonBase,
        // width: 'min(55%, 200px)',
        background: 'linear-gradient(rgb(29, 29, 29), #0a3d1e) padding-box, linear-gradient(to top, #1cb34a, #0a3d1e) border-box',
        '&:hover': {
            background: 'linear-gradient(rgb(29, 29, 29),rgb(20, 81, 40)) padding-box, linear-gradient(to top, #2ad44c, #0a3d1e) border-box',
            boxShadow: '0 0 8px rgba(0, 170, 70, 0.7)',
            border: '1px solid rgba(0, 200, 90, 0.7)',
        },
    },
    quickUndoButtonDisabled: {
        ...quickUndoButtonBase,
        // width: 'min(55%, 200px)',
        '&:disabled': {
            backgroundColor: '#404040',
            color: '#FFF',
        },
    },
    quickUndoButtonBlocked: {
        ...quickUndoButtonBase,
        width: 'min(65%, 240px)',
        '&:disabled': {
            backgroundColor: '#404040',
            color: '#FFF',
        },
    },
    quickUndoButtonRequest: {
        ...quickUndoButtonBase,
        width: 'min(65%, 240px)',
        background: 'linear-gradient(#1E2D32, #1E2D32) padding-box, linear-gradient(#404040, #008FC4) border-box',
        '&:hover': {
            background: 'linear-gradient(#2C4046, #2C4046) padding-box, linear-gradient(#404040, #008FC4) border-box',
        },
    },
    actionIconButton: {
        padding: { xs: '9px', md: '12px' },
        color: '#fff',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        '& svg': {
            fontSize: { xs: '1.35rem', md: '1.65rem' },
        },
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.16)',
            borderColor: 'rgba(255, 255, 255, 0.24)',
        },
    }
}
const UndoButton = () => {
    const { gameState, sendGameMessage, connectedPlayer } = useGame();
    const correctPlayer = gameState.players[connectedPlayer];
    const quickUndoState: QuickUndoAvailableState | null = correctPlayer?.availableSnapshots?.quickSnapshotAvailable;
    const handleUndoButton = () => {
        sendGameMessage(['rollbackToSnapshot',{
            type: 'quick',
            playerId: connectedPlayer,
            actionOffset: 0
        }])
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
        <Box sx={styles.quickUndoBox}>
            <Button
                variant="contained"
                onClick={handleUndoButton}
                disabled={undoButtonDisabled}
                startIcon={buttonIcon}
                sx={undoButtonStyle}
            >
                {buttonText}
            </Button>
        </Box>
    )
}

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, preferenceToggle, quitMatch }) => {
    const { gameMessages, sendGameMessage, isSpectator } = useGame();
    const { handleTypingStateOnChange, resetTypingState } = useChatTypingState();
    const [chatMessage, setChatMessage] = useState('')
    const showUndoAction = !isSpectator;

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

    const matchActions = (
        <Box sx={styles.matchActions}>
            {showUndoAction && (<UndoButton />)}
            <Box sx={styles.actionIconGroup}>
                <Tooltip title="Settings">
                    <IconButton
                        aria-label="Settings"
                        onClick={preferenceToggle}
                        sx={styles.actionIconButton}
                    >
                        <SettingsOutlinedIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Quit match">
                    <IconButton
                        aria-label="Quit match"
                        onClick={quitMatch}
                        sx={styles.actionIconButton}
                    >
                        <LogoutOutlinedIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    return (
        <Drawer
            anchor="right"
            open={sidebarOpen}
            variant="persistent"
            sx={styles.drawerStyle}
        >
            {matchActions}
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
