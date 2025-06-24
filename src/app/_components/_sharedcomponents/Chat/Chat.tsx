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
import { IChatProps, IChatEntry, IChatObject } from './ChatTypes';
import { useGame } from '@/app/_contexts/Game.context';

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
}) => {
    const { connectedPlayer, isSpectator, getOpponent } = useGame();
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    // Function to format message items, handling spectator view
    const formatMessageItem = (item: IChatObject | string | number) => {
        if (typeof item === 'object') {
            // Console log the full card object when it appears in chat
            console.log('Card mentioned in chat:', item);
            
            // Determine the card name to display
            let cardName;
            if (isSpectator && item.id) {
                cardName = item.id === connectedPlayer ? 'Player 1' : item.id === getOpponent(connectedPlayer) ? 'Player 2' : item.name;
            } else {
                cardName = item.name;
            }
            
            // Style based on whether this is a card or player object
            const cardItem = item as IChatObject & { controllerId?: string };
            
            // Check if this is a card object (has controllerId)
            if (cardItem.controllerId) {
                const isPlayerCard = cardItem.controllerId === connectedPlayer;
                const cardColor = isPlayerCard ? 'var(--initiative-blue)' : 'var(--initiative-red)';
                return `<span style="color: ${cardColor}; font-weight: bold;">${cardName}</span>`;
            } else {
                // This is likely a player object, style based on player id
                const isCurrentPlayer = item.id === connectedPlayer;
                const playerColor = isCurrentPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)';
                return `<span style="color: ${playerColor}; font-weight: bold;">${cardName}</span>`;
            }
        }
        // If not an object, just return the string
        if (typeof item === 'string' || typeof item === 'number') {
            return item;
        }
        return '';
    };

    // TODO: Standardize these chat types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatMessage = (message: any, index: number) => {
        try {
            let textStyle;
            let messageText;

            if (message.hasOwnProperty('alert')) {                
                switch (message.alert.type) {
                    case 'notification':
                        textStyle = styles.notificationText;
                        break;
                    case 'warning':
                        textStyle = styles.warningText;
                        break;
                    case 'danger':
                        textStyle = styles.alertText;
                        break;
                    case 'readyStatus':
                        textStyle = styles.readyStatusText;
                        break;
                    default:
                        textStyle = styles.messageText;
                }

                messageText = message.alert.message;
            } else if (message[0].type === 'playerChat') {
                return (
                    <Typography key={index} sx={styles.messageText}>
                        <span style={{ 
                            color: connectedPlayer === message[0].id ? 'var(--initiative-blue)' : 'var(--initiative-red)',
                            fontWeight: 'bold'
                        }}>
                            {isSpectator ? connectedPlayer === message[0].id ? 'Player 1' : 'Player 2' : message[0].name}
                        </span>
                        : {message.slice(1).join('')}
                    </Typography>
                )
            } else {
                messageText = message;
                textStyle = styles.messageText;
            }
            const stringMessage = messageText.map((item: IChatObject | string) => formatMessageItem(item)).join('');
            return (
                <Typography key={index} sx={textStyle} dangerouslySetInnerHTML={{ __html: stringMessage }} />
            )
        } catch (error) {
            console.error('Error formatting message:', error);
            return null;
        }
    }

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
        playerName: {
            fontSize: { xs: '0.75em', md: '1em' },
            lineHeight: { xs: '0.75rem', md: '1rem' },
        },
        notificationText: {
            fontSize: { xs: '0.85em', md: '1em' },
            color: '#d500f9',
            fontWeight: 'bold',
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
            fontWeight: 'bold',
            lineHeight: { xs: '0.85rem', md: '1em' },
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
                // base border style
                '& fieldset': {
                    borderColor: '#fff',
                },
            },
            '& .MuiOutlinedInput-root.Mui-focused': {
                // when container is focused
                '& fieldset': {
                    borderColor: '#fff',
                },
            },
        }
    }

    

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
