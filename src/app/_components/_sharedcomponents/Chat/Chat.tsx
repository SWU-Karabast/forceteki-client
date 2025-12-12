import React, { useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    InputAdornment,
    Divider,
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

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
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
        // Always allow chat for private lobbies
        if (isPrivateLobby) {
            return { reason: ChatDisabledReason.None, message: '', borderColor: '' };
        }

        switch (true) {
            case !user:
                return {
                    reason: ChatDisabledReason.NotLoggedIn,
                    message: 'Log in to enable chat',
                    borderColor: 'red'
                };

            case !!(user?.moderation):
                return {
                    reason: ChatDisabledReason.UserMuted,
                    message: `You are muted for ${getMuteDisplayText(user.moderation)}`,
                    borderColor: 'yellow'
                };

            case opponentChatDisabled:
                return {
                    reason: ChatDisabledReason.OpponentDisabledChat,
                    message: 'The opponent has disabled chat',
                    borderColor: 'yellow'
                };

            case isAnonymousOpponent:
                return {
                    reason: ChatDisabledReason.AnonymousOpponent,
                    message: 'Chat disabled when playing against an anonymous opponent',
                    borderColor: 'yellow'
                };

            default:
                return { reason: ChatDisabledReason.None, message: '', borderColor: '' };
        }
    };


    const getPlayerColor = (playerId: string, connectedPlayer: string): string => {
        return playerId === connectedPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)';
    };

    const isPrivateLobby = lobbyState?.gameType === 'Private';
    const isAnonymousOpponent = isAnonymousPlayer(getOpponent(connectedPlayer));
    const opponentChatDisabled = hasChatDisabled(getOpponent(connectedPlayer));
    const chatDisabledInfo = getChatDisabledInfo();
    // Helper function to determine if chat input should be shown
    const shouldShowChatInput = !chatDisabledInfo || chatDisabledInfo.reason === ChatDisabledReason.None;

    const getSpectatorDisplayName = (
        playerId: string,
        connectedPlayer: string,
        getOpponent: (player: string) => string
    ): string => {
        if (playerId === connectedPlayer) return 'Player 1';
        if (playerId === getOpponent(connectedPlayer)) return 'Player 2';
        return 'Unknown Player';
    };

    const isOpponentMessage = (message: IChatMessageContent, connectedPlayerId: string): boolean => {
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
            return item;
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


    const formatMessage = (message: IChatMessageContent, index: number) => {
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
                return isOpponentMessage(messageEntry.message, connectedPlayer);
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
        messageText: {
            fontSize: { xs: '0.75em', md: '1em' },
            color: '#fff',
            lineHeight: { xs: '0.75rem', md: '1rem' },
            m: 0

        },
        // Base style for alert messages
        alertBase: {
            fontSize: { xs: '0.85em', md: '1em' },
            lineHeight: { xs: '0.85rem', md: '1em' },
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
            px: { xs: '0.2em', md: '0.5em' },
            mb: 2,
            minHeight: { xs: '1.5rem', md: '2.6rem' },
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
            fontSize: { xs: '0.75em', md: '1em' },
            height: { xs: '1.8rem', md: '2.2rem' },
            input: { color: '#fff', padding: '0.3em 0.5em' },
            '& .MuiOutlinedInput-root': {
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
        chatDisabled: (borderColor: string) => ({
            textAlign: 'center',
            border: `1px solid ${borderColor}`,
            backgroundColor: '#282828ff',
            borderRadius: '4px',
            p: '0.4em',
            mt: '0.5em',
            width: '100%',
            display: 'block',
            fontSize: { xs: '0.75em', md: '1em' },
            color: '#fff',
            lineHeight: { xs: '0.75rem', md: '1rem' },
            userSelect: 'none',
        })
    };

    

    return (
        <>
            <Box sx={styles.chatBox}>
                {chatHistory && chatHistory.map((chatEntry: IChatEntry, index: number) => {
                    return formatMessage(chatEntry.message, index);
                })}
                <Box ref={chatEndRef} />
            </Box>


            <Box sx={styles.inputContainer}>
                {/* Show chat input based on game state and user permissions */}
                {shouldShowChatInput && (
                    <TextField
                        variant="outlined"
                        placeholder="Chat"
                        autoComplete="off"
                        value={chatMessage}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setChatMessage(e.target.value)
                        }
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
                                        <IconButton size="small" onClick={handleChatSubmit}>
                                            <Send sx={{ color: '#fff', fontSize: '1.1em' }} />
                                        </IconButton>
                                    </InputAdornment>
                                ),
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