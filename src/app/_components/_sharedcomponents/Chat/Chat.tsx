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

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
}) => {
    const { connectedPlayer, isSpectator, getOpponent } = useGame();
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const previousMessagesRef = useRef<IChatEntry[]>([]);

    const getPlayerColor = (playerId: string, connectedPlayer: string): string => {
        return playerId === connectedPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)';
    };
    const messageSound = typeof Audio !== 'undefined' ? new Audio('/click1.mp3') : null;
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

    const playMessageSound = () => {
        if (messageSound && !isSpectator) {
            messageSound.currentTime = 0; // Reset to start
            messageSound.play().catch((e) => {
                console.warn('Message sound failed to play:', e);
            });
        }
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
            switch (type) {
                case 'notification': return styles.notificationText;
                case 'warning': return styles.warningText;
                case 'danger': return styles.alertText;
                case 'readyStatus': return styles.readyStatusText;
                default: return styles.messageText;
            }
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
                {index < (chatHistory?.length || 0) - 1 && (
                    <Divider sx={styles.chatEntryDivider} />
                )}
            </Box>
        );
    };

    const formatPlayerChatMessage = (message: IPlayerChatMessageArray, index: number) => {
        const [playerMessage, ...messageContent] = message;
        const displayName = isSpectator 
            ? getSpectatorDisplayName(playerMessage.id, connectedPlayer, getOpponent)
            : playerMessage.name;

        return (
            <Box key={index} sx={styles.chatEntryBox}>
                <Typography sx={styles.messageText}>
                    <span style={{ 
                        color: getPlayerColor(playerMessage.id, connectedPlayer),
                        fontWeight: 'bold'
                    }}>
                        {displayName}
                    </span>
                    : {messageContent.join('')}
                </Typography>
                {index < (chatHistory?.length || 0) - 1 && (
                    <Divider sx={styles.chatEntryDivider} />
                )}
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
                playMessageSound();
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
        divider: {
            backgroundColor: '#fff',
            mt: '.5vh',
            mb: '0.5vh',
        },
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
        },
        notificationText: {
            fontSize: { xs: '0.85em', md: '1em' },
            color: '#d500f9',
            lineHeight: { xs: '0.85rem', md: '1em' },
        },
        warningText: {
            fontSize: { xs: '0.85em', md: '1em' },
            color: 'yellow',
            lineHeight: { xs: '0.85rem', md: '1em' },
        },
        alertText: {
            fontSize: { xs: '0.85em', md: '1em' },
            color: 'red',
            lineHeight: { xs: '0.85rem', md: '1em' },
        },
        readyStatusText: {
            fontSize: { xs: '0.85em', md: '1em' },
            color: 'green',
            lineHeight: { xs: '0.85rem', md: '1em' },
        },
        chatEntryBox: {
            py: '0.25rem',
        },
        chatEntryDivider: {
            borderColor: '#FFFE50',
            opacity: 0.3,
            my: '0.25rem',
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
        }
    };

    

    return (
        <>
            <Divider sx={styles.divider} />
            <Box sx={styles.chatBox}>
                {chatHistory && chatHistory.map((chatEntry: IChatEntry, index: number) => {
                    return formatMessage(chatEntry.message, index);
                })}
                <Box ref={chatEndRef} />
            </Box>


            <Box sx={styles.inputContainer}>
                {!isSpectator &&(
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
            </Box>
        </>
    );
};

export default Chat;
