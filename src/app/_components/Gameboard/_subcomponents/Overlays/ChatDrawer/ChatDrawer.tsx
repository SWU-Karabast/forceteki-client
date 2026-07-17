import React, { useState } from 'react';
import {
    Drawer,
    Box,
    Button,
    IconButton,
    Divider,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    SwipeableDrawer,
    Tooltip,
    useMediaQuery,
    useTheme,
} from '@mui/material';
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
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import CommentsDisabledIcon from '@mui/icons-material/CommentsDisabled';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { MatchmakingType, QuickUndoAvailableState } from '@/app/_constants/constants';
import { useChatTypingState } from '@/app/_hooks/useChatTypingState';
import { usePopup } from '@/app/_contexts/Popup.context';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { ChatDisabledReason, IChatDisabledInfo } from '@/app/_contexts/UserTypes';
import { getMuteDisplayText } from '@/app/_utils/ModerationUtils';
import { LobbyConfirmationPopupModule } from '@/app/_components/Lobby/_subcomponents/LobbyConfirmationPopup/LobbyConfirmationPopup';
import PlayerReportDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PlayerReportDialog';
import { Theme } from '@mui/material/styles';

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
    mobileDrawerStyle: {
        '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
        },
        '& .MuiDrawer-paper': {
            backgroundColor: '#000000E6',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            width: { xs: '200px', md: 'min(20%, 280px)' },
            padding: '0.75em',
            overflow: 'visible',
            '&::before': {
                content: '""',
                position: 'absolute',
                left: '-27px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '27px',
                height: '54px',
                backgroundColor: '#000000E6',
                border: '1px solid rgba(143, 214, 255, 0.85)',
                borderRight: 'none',
                borderRadius: '27px 0 0 27px',
                transition: 'border-color 225ms ease',
                pointerEvents: 'none',
            },
            '&::after': {
                content: '""',
                position: 'absolute',
                left: '-14px',
                top: '50%',
                width: '7px',
                height: '7px',
                borderLeft: '2px solid #fff',
                borderBottom: '2px solid #fff',
                filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.55))',
                transform: 'translateY(-50%) rotate(45deg)',
                transition: 'transform 225ms ease',
                pointerEvents: 'none',
            },
        },
    },
    mobileDrawerOpenStyle: {
        '& .MuiDrawer-paper::before': {
            borderColor: 'rgba(255, 255, 255, 0.16)',
            borderRight: 'none',
        },
        '& .MuiDrawer-paper::after': {
            transform: 'translateY(-50%) rotate(225deg)',
        },
    },
    mobileClosedSwipeHint: {
        position: 'fixed',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '40px',
        height: '54px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 0,
        pointerEvents: 'none',
        zIndex: 9,
        '&::before': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: 0,
            width: '27px',
            height: '54px',
            backgroundColor: '#000000E6',
            border: '1px solid rgba(143, 214, 255, 0.85)',
            borderRight: 0,
            borderRadius: '27px 0 0 27px',
            boxShadow: '-2px 0 10px rgba(0, 186, 255, 0.48), inset 2px 0 6px rgba(255, 255, 255, 0.14)',
        },
    },
    mobileClosedSwipeHintButton: {
        padding: 0,
        cursor: 'pointer',
        pointerEvents: 'auto',
        // The drawer's invisible swipe area uses drawer - 1 and otherwise intercepts the click.
        zIndex: (theme: Theme) => theme.zIndex.drawer,
    },
    mobileClosedSwipeHintChevron: {
        width: '7px',
        height: '7px',
        borderLeft: '2px solid #fff',
        borderBottom: '2px solid #fff',
        filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.55))',
        transform: 'rotate(45deg)',
        position: 'absolute',
        right: '5px',
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
        ml: 'auto',
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
    undoActionButton: {
        minWidth: 0,
        padding: '10px 12px',
        borderRadius: '999px',
        fontSize: '0.8rem',
        fontWeight: 600,
        lineHeight: 1,
        textTransform: 'none',
        whiteSpace: 'nowrap',
        '& .MuiButton-startIcon': {
            marginLeft: 0,
            marginRight: '6px',
        },
    },
    collapseDrawerButton: {
        display: { xs: 'none', md: 'inline-flex' },
    },
    quickUndoButtonEnabled: {
        borderColor: 'rgba(255, 255, 255, 0.12)',
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
        mt: '0.3rem',
    },
    menuIcon: {
        color: '#E0E0E0',
        minWidth: '36px',
    },
}

const MobileClosedSwipeHint = ({ onClick }: { onClick?: () => void }) => (
    <Box
        aria-hidden={onClick ? undefined : true}
        aria-label={onClick ? 'Open chat drawer' : undefined}
        component={onClick ? 'button' : 'div'}
        onClick={onClick}
        sx={onClick ? [styles.mobileClosedSwipeHint, styles.mobileClosedSwipeHintButton] : styles.mobileClosedSwipeHint}
        type={onClick ? 'button' : undefined}
    >
        <Box component="span" sx={styles.mobileClosedSwipeHintChevron} />
    </Box>
);

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

    let buttonText;
    let buttonIcon;
    let ariaLabel;
    switch (quickUndoState) {
        case QuickUndoAvailableState.RequestUndoAvailable:
            buttonText = 'Request';
            buttonIcon = <MessageIcon />;
            ariaLabel = 'request undo';
            break;
        case QuickUndoAvailableState.UndoRequestsBlocked:
            buttonText = 'Blocked';
            buttonIcon = <BlockIcon />;
            ariaLabel = 'undo requests blocked';
            break;
        case QuickUndoAvailableState.WaitingForConfirmation:
            buttonText = 'Waiting';
            buttonIcon = <BlockIcon />;
            ariaLabel = 'undo waiting for confirmation';
            break;
        default:
            buttonText = 'Undo';
            buttonIcon = <UndoIcon />;
            ariaLabel = 'Undo last action';
            break;
    }

    return (
        <Tooltip title={ariaLabel}>
            <span>
                <Button
                    aria-label={ariaLabel}
                    onClick={handleUndoButton}
                    disabled={disabledOverride || undoButtonDisabled}
                    startIcon={buttonIcon}
                    sx={[styles.drawerActionButton, styles.undoActionButton, undoButtonStyle]}
                >
                    {buttonText}
                </Button>
            </span>
        </Tooltip>
    )
}

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar, preferenceToggle }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const {
        gameState,
        gameMessages,
        sendGameMessage,
        sendLobbyMessage,
        isSpectator,
        lobbyState,
        connectedPlayer,
        getOpponent,
        isAnonymousPlayer,
        hasChatDisabled,
    } = useGame();
    const { handleTypingStateOnChange, resetTypingState } = useChatTypingState();
    const [chatMessage, setChatMessage] = useState('')
    const [menuAnchorElement, setMenuAnchorElement] = useState<null | HTMLElement>(null);
    const [showDisableChatConfirmation, setShowDisableChatConfirmation] = useState(false);
    const [showConcedeConfirmation, setShowConcedeConfirmation] = useState(false);
    const [playerReportOpen, setPlayerReportOpen] = useState(false);
    const { openPopup } = usePopup();
    const { user } = useUser();
    const router = useRouter();
    const isDev = process.env.NODE_ENV === 'development';
    const isUndoEnabled = isDev || gameState.undoEnabled;
    const shouldShowUndo = !isSpectator;
    const isMenuOpen = Boolean(menuAnchorElement);
    const isPrivateLobby = lobbyState?.gameType === MatchmakingType.PrivateLobby;
    const didCurrentUserMuteChat = lobbyState?.userWhoMutedChat === connectedPlayer;
    const doesUserHaveChatMuted = user?.preferences?.gameOptions?.muteChat;
    const opponentId = getOpponent(connectedPlayer);
    const isAnonymousOpponent = isAnonymousPlayer(opponentId);
    const opponentChatDisabled = hasChatDisabled(opponentId);
    const canReportOpponent = !isSpectator && !isAnonymousPlayer(connectedPlayer) && (!!opponentId && !isAnonymousOpponent);
    const isReportingDisabled = !!user?.reportingDisabled;

    const getChatDisabledInfo = (): IChatDisabledInfo => {
        if (isPrivateLobby && !doesUserHaveChatMuted) {
            return { reason: ChatDisabledReason.None, message: '', borderColor: '' };
        }

        switch (true) {
            case !user && process.env.NEXT_PUBLIC_FORCE_ENABLE_ANON_CHAT !== 'true':
                return {
                    reason: ChatDisabledReason.NotLoggedIn,
                    message: 'Log in to enable chat',
                    borderColor: 'red'
                };
            case !!(user?.moderation):
                const muteText = getMuteDisplayText(user.moderation);
                return {
                    reason: ChatDisabledReason.UserMuted,
                    message: `You are muted for ${muteText}`,
                    borderColor: 'yellow'
                };
            case isAnonymousOpponent && process.env.NEXT_PUBLIC_FORCE_ENABLE_ANON_CHAT !== 'true':
                return {
                    reason: ChatDisabledReason.AnonymousOpponent,
                    message: 'Chat disabled when playing against an anonymous opponent',
                    borderColor: 'yellow'
                };
            case didCurrentUserMuteChat:
                return {
                    reason: ChatDisabledReason.UserDisabledChat,
                    message: 'You disabled chat',
                    borderColor: 'yellow'
                };
            case doesUserHaveChatMuted:
                return {
                    reason: ChatDisabledReason.UserDisabledChat,
                    message: 'You have chat disabled in your account preferences',
                    borderColor: 'yellow'
                };
            case opponentChatDisabled:
                return {
                    reason: ChatDisabledReason.OpponentDisabledChat,
                    message: 'The opponent has disabled chat',
                    borderColor: 'yellow'
                };
            default:
                return { reason: ChatDisabledReason.None, message: '', borderColor: '' };
        }
    };

    const chatDisabledInfo = getChatDisabledInfo();
    const shouldShowChatInput = chatDisabledInfo.reason === ChatDisabledReason.None;

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

    const handleDrawerOpen = () => {
        if (!sidebarOpen) {
            toggleSidebar();
        }
    }

    const handleDrawerClose = () => {
        if (sidebarOpen) {
            toggleSidebar();
        }
    }

    const closeMobileDrawer = () => {
        if (isMobile) {
            handleDrawerClose();
        }
    }

    const handlePreferenceClick = () => {
        handleMenuClose();
        closeMobileDrawer();
        preferenceToggle();
    }

    const handleLeaveGameClick = () => {
        handleMenuClose();
        closeMobileDrawer();
        if (isSpectator){
            router.push('/');
        } else {
            openPopup('leaveGame', {
                uuid: `${uuidv4()}`,
                source: PopupSource.User
            });
        }
    }

    const handleConcedeClick = () => {
        handleMenuClose();
        closeMobileDrawer();
        setShowConcedeConfirmation(true);
    }

    const handleConfirmConcede = () => {
        const playerName = gameState.players[connectedPlayer]?.name;
        sendGameMessage(['concede', playerName]);
        setShowConcedeConfirmation(false);
    };

    const handleCancelConcede = () => {
        setShowConcedeConfirmation(false);
    };

    const handleDisableChatClick = () => {
        handleMenuClose();
        closeMobileDrawer();
        setShowDisableChatConfirmation(true);
    }

    const handleConfirmDisableChat = () => {
        sendLobbyMessage(['muteChat']);
        setShowDisableChatConfirmation(false);
    };

    const handleCancelDisableChat = () => {
        setShowDisableChatConfirmation(false);
    };

    const handleOpenPlayerReport = () => {
        handleMenuClose();
        closeMobileDrawer();
        setPlayerReportOpen(true);
    };

    const handleClosePlayerReport = () => {
        setPlayerReportOpen(false);
    };

    const drawerContent = (
        <>
            <Box sx={styles.headerBoxStyle}>
                <Tooltip title="Collapse chat">
                    <IconButton aria-label="collapse drawer" onClick={toggleSidebar} sx={[styles.drawerActionButton, styles.collapseDrawerButton]}>
                        <ChevronRightIcon />
                    </IconButton>
                </Tooltip>
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
                        {!isSpectator && (
                            <MenuItem disabled={!shouldShowChatInput} onClick={handleDisableChatClick}>
                                <ListItemIcon sx={styles.menuIcon}>
                                    <CommentsDisabledIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{shouldShowChatInput ? 'Disable chat' : 'Chat is disabled'}</ListItemText>
                            </MenuItem>
                        )}
                        {!isSpectator && canReportOpponent && (
                            <MenuItem disabled={isReportingDisabled} onClick={handleOpenPlayerReport}>
                                <ListItemIcon sx={styles.menuIcon}>
                                    <ReportProblemIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>{isReportingDisabled ? 'Reporting disabled' : 'Report Opponent'}</ListItemText>
                            </MenuItem>
                        )}
                        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.14)' }} />
                        {!isSpectator && (
                            <MenuItem onClick={handleConcedeClick}>
                                <ListItemIcon sx={styles.menuIcon}>
                                    <OutlinedFlagIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText>Concede game</ListItemText>
                            </MenuItem>
                        )}
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

            <LobbyConfirmationPopupModule title={'Concede Game Confirmation'} message={'Are you sure you wish to concede? This game will count as a loss.'} display={showConcedeConfirmation} onConfirmation={handleConfirmConcede} handleCancel={handleCancelConcede}/>
            <LobbyConfirmationPopupModule title={'Disable Chat Confirmation'} message={'Are you sure you wish to disable chat for this game? This action is not reversable.'} display={showDisableChatConfirmation} onConfirmation={handleConfirmDisableChat} handleCancel={handleCancelDisableChat}/>
            <PlayerReportDialog open={playerReportOpen} onClose={handleClosePlayerReport}/>
        </>
    );

    if (isMobile) {
        return (
            <>
                {!sidebarOpen && (
                    <MobileClosedSwipeHint onClick={handleDrawerOpen} />
                )}
                <SwipeableDrawer
                    anchor="right"
                    open={sidebarOpen}
                    onOpen={handleDrawerOpen}
                    onClose={handleDrawerClose}
                    sx={sidebarOpen ? [styles.mobileDrawerStyle, styles.mobileDrawerOpenStyle] : styles.mobileDrawerStyle}
                    disableBackdropTransition
                    // Android reserves edge swipes for system navigation. Use the visible
                    // indicator to open the drawer and keep swipe gestures for closing it.
                    disableSwipeToOpen
                >
                    {drawerContent}
                </SwipeableDrawer>
            </>
        );
    }

    return (
        <Drawer
            anchor="right"
            open={sidebarOpen}
            variant="persistent"
            sx={styles.drawerStyle}
        >
            {drawerContent}
        </Drawer>
    );
};

export default ChatDrawer;
