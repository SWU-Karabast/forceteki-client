import React, { useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    InputAdornment,
    Typography,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { 
    IChatProps, 
    IChatEntry, 
    IChatObject, 
    IChatMessageContent, 
    IPlayerChatMessageArray,
    ChatObjectType
} from './ChatTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChatCard from './ChatCard';
import { useSoundHandler } from '@/app/_hooks/useSoundHandler';
import { useUser } from '@/app/_contexts/User.context';
import { getMuteDisplayText } from '@/app/_utils/ModerationUtils';
import { ChatDisabledReason, IChatDisabledInfo } from '@/app/_contexts/UserTypes';
import { ILobbyUserProps } from '../../Lobby/LobbyTypes';
import { MatchmakingType } from '@/app/_constants/constants';
import RichText from '../RichText/RichText';

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    handleChatOnChange,
    handleChatSubmit,
}) => {
    const { lobbyState, connectedPlayer, isSpectator, getOpponent, isAnonymousPlayer, hasChatDisabled } = useGame();
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const previousMessagesRef = useRef<IChatEntry[]>([]);
    const { user } = useUser();

    // Initialize sound handler with user preferences
    const { playIncomingMessageSound } = useSoundHandler({
        enabled: !isSpectator, // Don't play sounds for spectators
        user,
    });

    const getChatDisabledInfo = (): IChatDisabledInfo => {
        // Always allow chat for private lobbies except if the user has chat disabled in preferences
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

    const getPlayerColor = (playerId: string, connectedPlayer: string): string => {
        return playerId === connectedPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)';
    };

    const isPrivateLobby = lobbyState?.gameType === MatchmakingType.PrivateLobby;
    const didCurrentUserMuteChat = lobbyState?.userWhoMutedChat === connectedPlayer;
    const doesUserHaveChatMuted = user?.preferences?.gameOptions?.muteChat;
    const opponentId = getOpponent(connectedPlayer);
    const opponent = lobbyState?.users.find((u: ILobbyUserProps) => u.id === opponentId);
    const isAnonymousOpponent = isAnonymousPlayer(opponentId);
    const opponentChatDisabled = hasChatDisabled(opponentId);
    const chatDisabledInfo = getChatDisabledInfo();
    // Helper function to determine if chat input should be shown
    const shouldShowChatInput = !chatDisabledInfo || chatDisabledInfo.reason === ChatDisabledReason.None;
    const opponentIsTyping = lobbyState?.gameChat.typingState[opponentId];

    const getSpectatorDisplayName = (
        playerId: string,
        connectedPlayer: string,
        getOpponent: (player: string) => string
    ): string => {
        if (playerId === connectedPlayer) return 'Player 1';
        if (playerId === getOpponent(connectedPlayer)) return 'Player 2';
        return 'Unknown Player';
    };

    const isOpponentMessage = (message: IChatMessageContent | undefined, connectedPlayerId: string): boolean => {
        if (!message) return false;

        // Check if it's a player chat message
        if (Array.isArray(message) && message.length > 0) {
            const firstItem = message[0];
            // Player chat messages start with a player object that has type: 'playerChat'
            if (firstItem && typeof firstItem === 'object' && firstItem.type === 'playerChat') {
                return firstItem.id !== connectedPlayerId;
            }
        }
        return false;
    };

    const formatMessageItem = (item: IChatObject | string | number, itemIndex: number) => {
        if (item == null) {
            return '[null]';
        }
        if (typeof item === 'object') {
            if (item.type === ChatObjectType.Card) {
                const displayName = item.name;
                const isPlayerCard = item.controllerId === connectedPlayer;
                
                return (
                    <ChatCard 
                        key={`card-${itemIndex}`}
                        chatObject={item} 
                        isPlayerCard={isPlayerCard}
                    >
                        <span style={{ 
                            color: getPlayerColor(item.controllerId!, connectedPlayer),
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted'
                        }}>
                            {displayName}
                        </span>
                    </ChatCard>
                );
            }
            
            if (item.type === ChatObjectType.Player) {
                // Only players should use spectator display names
                const displayName = isSpectator && item.id 
                    ? getSpectatorDisplayName(item.id, connectedPlayer, getOpponent)
                    : item.name;
                    
                return (
                    <span key={`player-${itemIndex}`} style={{ 
                        color: getPlayerColor(item.id, connectedPlayer)
                    }}>
                        {displayName}
                    </span>
                );
            }
            
            // Fallback for unknown object types
            const displayName = isSpectator && item.id 
                ? getSpectatorDisplayName(item.id, connectedPlayer, getOpponent)
                : item.name;
            return (
                <span key={`unknown-${itemIndex}`} style={{ color: '#fff' }}>
                    {displayName}
                </span>
            );
        }
        if (typeof item === 'string' || typeof item === 'number') {
            return (
                <RichText key={`text-${itemIndex}`} text={item.toString()} />
            );
        }
        return '[invalid]';
    };

    const formatSystemMessage = (
        messageContent: (IChatObject | string | number)[], 
        index: number, 
        isAlert: boolean = false, 
        alertType?: string
    ) => {
        const getAlertStyle = (type: string) => {
            const alertColors = {
                notification: '#d500f9',
                warning: 'yellow',
                danger: 'red',
                readyStatus: 'green'
            };

            const color = alertColors[type as keyof typeof alertColors];
            return color ? { ...styles.alertBase, color } : styles.messageText;
        };

        const messageComponents = messageContent.map((item, itemIndex) => 
            formatMessageItem(item, itemIndex)
        );
        
        const textStyle = isAlert && alertType ? getAlertStyle(alertType) : styles.messageText;
        
        return (
            <Box key={index} sx={styles.chatEntryBox}>
                <Typography sx={textStyle} component="div">
                    {messageComponents}
                </Typography>
            </Box>
        );
    };

    const formatPlayerChatMessage = (message: IPlayerChatMessageArray, index: number) => {
        const [playerMessage, ...messageContent] = message;
        const displayName = isSpectator 
            ? getSpectatorDisplayName(playerMessage.id, connectedPlayer, getOpponent)
            : playerMessage.name;
        const playerColor = getPlayerColor(playerMessage.id, connectedPlayer);

        return (
            <Box key={index} sx={{ ...styles.chatEntryBox, backgroundColor: `color-mix(in srgb, ${playerColor} 13%, transparent)` }}>
                <Typography sx={styles.messageText}>
                    <span style={{ 
                        color: playerColor,
                        fontWeight: 'bold'
                    }}>
                        {displayName}
                    </span>
                    : {messageContent.join('')}
                </Typography>
            </Box>
        );
    };


    const formatMessage = (message: IChatMessageContent | undefined, index: number) => {
        if (!message) {
            // Custom gray message for pending missing (shouldn't really happen in practice as retransmit is fast)
            return (
                <Box key={index} sx={styles.chatEntryBox}>
                    <Typography sx={{ ...styles.messageText, color: '#888', fontStyle: 'italic' }}>
                        Fetching missing message...
                    </Typography>
                </Box>
            );
        }
        if ('alert' in message) {
            return formatSystemMessage(message.alert.message, index, true, message.alert.type);
        }
        
        if (Array.isArray(message)) {
            if (message.length > 0 && 
                typeof message[0] === 'object' && 'type' in message[0] && message[0].type === 'playerChat') {
                return formatPlayerChatMessage(message as IPlayerChatMessageArray, index);
            }
            return formatSystemMessage(message as (IChatObject | string | number)[], index);
        }

        return null;
    };

    // Monitor chat history for new opponent messages
    useEffect(() => {
        if (!chatHistory || !connectedPlayer || isSpectator) return;
        const previousMessages = previousMessagesRef.current || [];
        // If we have more messages than before, check the new ones
        if (chatHistory.length > previousMessages.length) {
            const newMessages = chatHistory.slice(previousMessages.length);
            // Check if any new message is from opponent
            const hasOpponentMessage = newMessages.some(messageEntry => {
                return isOpponentMessage(messageEntry?.message, connectedPlayer);
            });
            if (hasOpponentMessage) {
                playIncomingMessageSound();
            }
        }

        // Update the previous messages reference
        previousMessagesRef.current = [...chatHistory];
    }, [chatHistory, connectedPlayer, isSpectator]);

    useEffect(() => {
        if(chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]);
    // ------------------------STYLES------------------------//

    const styles = {
        chatBox: {
            p: '0.5em',
            minHeight: '100px',
            overflowY: 'auto',
            backgroundColor: '#28282800',
            flex: 1,
        },
        chatMessageStack: {
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
        },
        messageText: {
            fontSize: { xs: '0.95rem', md: '1em' },
            color: '#fff',
            lineHeight: { xs: '1.25rem', md: '1rem' },
            m: 0

        },
        // Base style for alert messages
        alertBase: {
            fontSize: { xs: '0.95rem', md: '1em' },
            lineHeight: { xs: '1.25rem', md: '1em' },
        },
        chatEntryBox: {
            p: '1rem .25rem',
            borderTop: '1px solid',
            borderColor: '#FFFE5031',
        },
        chatEntryDivider: {
            borderColor: '#FFFE50',
            opacity: 0.3,
        },
        inputContainer: {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            backgroundColor: '#28282800',
            px: { xs: '0.25rem', md: '0.5em' },
            py: { xs: '0.25rem', md: 0 },
            minHeight: { xs: '48px', md: '2.6rem' },
        },
        textField: {
            backgroundColor: '#28282800',
            color: '#fff',
            borderRadius: '4px',
            flexGrow: 1,
            flex: 1,
            maxWidth: '100%',
            minWidth: 0,
            width: '100%',
            fontSize: { xs: '16px', md: '1em' },
            height: { xs: '44px', md: '2.2rem' },
            input: {
                color: '#fff',
                fontSize: { xs: '16px', md: '1em' },
                padding: { xs: '0 0.5rem', md: '0.3em 0.5em' },
                height: { xs: '44px', md: 'auto' },
                boxSizing: 'border-box',
            },
            '& .MuiInputBase-input': {
                fontSize: { xs: '16px', md: '1em' },
            },
            '& .MuiOutlinedInput-root': {
                height: { xs: '44px', md: '2.2rem' },
                pr: { xs: '4px', md: '8px' },
                '& fieldset': {
                    borderColor: '#fff',
                },
            },
            '& .MuiOutlinedInput-root.Mui-focused': {
                '& fieldset': {
                    borderColor: '#fff',
                },
            },
        },
        sendButton: {
            width: { xs: '40px', md: '32px' },
            height: { xs: '40px', md: '32px' },
            p: 0,
        },
        sendIcon: {
            color: '#fff',
            fontSize: { xs: '1.35rem', md: '1.1em' },
        },
        chatDisabled: (borderColor: string) => ({
            textAlign: 'center',
            border: `1px solid ${borderColor}`,
            backgroundColor: '#282828ff',
            borderRadius: '4px',
            p: '0.4em',
            mt: '0.5em',
            width: '100%',
            display: 'block',
            fontSize: { xs: '0.95rem', md: '1em' },
            color: '#fff',
            lineHeight: { xs: '1.25rem', md: '1rem' },
            userSelect: 'none',
        }),
        typingState: {
            container: {
                px: { xs: '0.2em', md: '0.5em' }
            },
            typography: {
                fontSize: { xs: '0.9rem', md: '0.8rem' },
                lineHeight: { xs: '1.2rem', md: '1rem' },
            }
        }
    };

    return (
        <>
            <Box sx={styles.chatBox}>
                <Box sx={styles.chatMessageStack}>
                    {chatHistory && chatHistory.map((chatEntry: IChatEntry, index: number) => {
                        return formatMessage(chatEntry?.message, index);
                    })}
                    <Box ref={chatEndRef} />
                </Box>
            </Box>

            {opponentIsTyping && (
                <Box sx={styles.typingState.container}>
                    <Typography sx={styles.typingState.typography}>{opponent?.username} is typing...</Typography>
                </Box>
            )}

            <Box sx={styles.inputContainer}>
                {/* Show chat input based on game state and user permissions */}
                {shouldShowChatInput && (
                    <TextField
                        variant="outlined"
                        placeholder="Chat"
                        autoComplete="off"
                        value={chatMessage}
                        onChange={handleChatOnChange}
                        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                            if (e.key === 'Enter') {
                                handleChatSubmit();
                            }
                        }}
                        sx={styles.textField}
                        slotProps={{
                            input: {
                                style: { fontSize: '1em' },
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ ml: 0, p: 0 }}>
                                        <IconButton sx={styles.sendButton} onClick={handleChatSubmit}>
                                            <Send sx={styles.sendIcon} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            },
                            htmlInput: {
                                style: { fontSize: '16px' },
                            },
                        }}
                    />
                )}
                {!shouldShowChatInput && !isSpectator &&(
                    <Typography sx={styles.chatDisabled(chatDisabledInfo.borderColor)}>
                        {chatDisabledInfo.message}
                    </Typography>
                )}
            </Box>
        </>

    );
};

export default Chat;
