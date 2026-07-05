import React, { useState } from 'react';
import { Drawer, Box, IconButton, Divider, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import UndoIcon from '@mui/icons-material/Undo';
import MessageIcon from '@mui/icons-material/Message';
import BlockIcon from '@mui/icons-material/Block';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import { QuickUndoAvailableState } from '@/app/_constants/constants';
import { useChatTypingState } from '@/app/_hooks/useChatTypingState';
import { usePopup } from '@/app/_contexts/Popup.context';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';

// ------------------------STYLES------------------------//
const styles = {
    drawerStyle: {
        flexShrink: 0,
        '& .MuiDrawer-paper': {
            backgroundColor: '#000000CC',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            width: { xs: '200px', md: 'min(20%, 280px)' },
            padding: '0.75em',
            overflow: 'hidden',
        },
    },
    headerBoxStyle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        mb: '0.75rem',
    },
    headerActionsStyle: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    drawerActionButton: {
        padding: '10px',
        color: '#fff',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '50%',
        '& svg': { fontSize: '1.45rem' },
        '&:hover': {
            background: 'rgba(255, 255, 255, 0.16)',
            borderColor: 'rgba(255, 255, 255, 0.24)',
        },
        '&:disabled': {
            color: 'rgba(255, 255, 255, 0.45)',
            background: 'rgba(255, 255, 255, 0.05)',
        },
    },
    quickUndoButtonEnabled: {
        borderColor: 'rgba(42, 212, 76, 0.7)',
        boxShadow: '0 0 8px rgba(0, 170, 70, 0.45)',
    },
    quickUndoButtonDisabled: {
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    quickUndoButtonBlocked: {
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    quickUndoButtonRequest: {
        borderColor: 'rgba(0, 143, 196, 0.8)',
        boxShadow: '0 0 8px rgba(0, 143, 196, 0.45)',
    },
    menuPaper: {
        backgroundColor: '#090f18',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        minWidth: '190px',
    },
    menuIcon: {
        color: '#E0E0E0',
        minWidth: '36px',
    }
}
const UndoButton = ({ disabledOverride = false }: { disabledOverride?: boolean }) => {
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

    let buttonIcon;
    let ariaLabel;
    switch (quickUndoState) {
        case QuickUndoAvailableState.RequestUndoAvailable:
            buttonIcon = <MessageIcon />;
            ariaLabel = 'request undo';
            break;
        case QuickUndoAvailableState.UndoRequestsBlocked:
            buttonIcon = <BlockIcon />;
            ariaLabel = 'undo requests blocked';
            break;
        case QuickUndoAvailableState.WaitingForConfirmation:
            buttonIcon = <BlockIcon />;
            ariaLabel = 'undo waiting for confirmation';
            break;
        default:
            buttonIcon = <UndoIcon />;
            ariaLabel = 'undo';
            break;
    }

    return (
        <IconButton
            aria-label={ariaLabel}
            onClick={handleUndoButton}
            disabled={disabledOverride || undoButtonDisabled}
            sx={[styles.drawerActionButton, undoButtonStyle]}
        >
            {buttonIcon}
        </IconButton>
    )
}

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar, preferenceToggle }) => {
    const { gameState, gameMessages, sendGameMessage, isSpectator } = useGame();
    const { handleTypingStateOnChange, resetTypingState } = useChatTypingState();
    const [chatMessage, setChatMessage] = useState('')
    const [menuAnchorElement, setMenuAnchorElement] = useState<null | HTMLElement>(null);
    const { openPopup } = usePopup();
    const router = useRouter();
    const isDev = process.env.NODE_ENV === 'development';
    const isUndoEnabled = isDev || gameState.undoEnabled;
    const shouldShowUndo = !isSpectator;
    const isMenuOpen = Boolean(menuAnchorElement);

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

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setMenuAnchorElement(event.currentTarget);
    }

    const handleMenuClose = () => {
        setMenuAnchorElement(null);
    }

    const handlePreferenceClick = () => {
        handleMenuClose();
        preferenceToggle();
    }

    const handleLeaveGameClick = () => {
        handleMenuClose();
        if (isSpectator){
            router.push('/');
        } else {
            openPopup('leaveGame', {
                uuid: `${uuidv4()}`,
                source: PopupSource.User
            });
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
                <IconButton aria-label="collapse drawer" onClick={toggleSidebar} sx={styles.drawerActionButton}>
                    <ChevronRightIcon />
                </IconButton>
                <Box sx={styles.headerActionsStyle}>
                    {shouldShowUndo && (<UndoButton disabledOverride={!isUndoEnabled} />)}
                    <IconButton
                        aria-label="game menu"
                        aria-controls={isMenuOpen ? 'chat-drawer-game-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={isMenuOpen ? 'true' : undefined}
                        onClick={handleMenuOpen}
                        sx={styles.drawerActionButton}
                    >
                        <MoreHorizIcon />
                    </IconButton>
                    <Menu
                        id="chat-drawer-game-menu"
                        anchorEl={menuAnchorElement}
                        open={isMenuOpen}
                        onClose={handleMenuClose}
                        slotProps={{ paper: { sx: styles.menuPaper } }}
                    >
                        <MenuItem onClick={handlePreferenceClick}>
                            <ListItemIcon sx={styles.menuIcon}>
                                <SettingsOutlinedIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Preferences</ListItemText>
                        </MenuItem>
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.14)' }} />
                        <MenuItem onClick={handleLeaveGameClick}>
                            <ListItemIcon sx={styles.menuIcon}>
                                <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Leave game</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>


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
