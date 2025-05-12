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
            // If user is a spectator, show Player 1/Player 2 instead of names
            if (isSpectator && item.id) {
                return item.id === connectedPlayer ? 'Player 1' : item.id === getOpponent(connectedPlayer) ? 'Player 2' : item.name;
            }
            // Otherwise show the actual name
            return item.name;
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
            if (message.hasOwnProperty('alert')) {
                return (
                    <Typography key={index} sx={styles.alertText}>
                        {message.alert.message.join('')}
                    </Typography>
                )
            } else if (message[0].type === 'playerChat') {
                return (
                    <Typography key={index} sx={styles.messageText}>
                        <span style={{ color: connectedPlayer === message[0].id ? 'var(--initiative-blue)' : 'var(--initiative-red)' }}>
                            {isSpectator ? connectedPlayer === message[0].id ? 'Player 1' : 'Player 2' : message[0].name}
                        </span>
                        : {message.slice(1).join('')}
                    </Typography>
                )
            }
            const stringMessage = message.map((item: IChatObject | string) => formatMessageItem(item)).join('');
            return (
                <Typography key={index} sx={styles.messageText}>
                    {stringMessage}
                </Typography>
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
        alertText: {
            fontSize: { xs: '0.85em', md: '1em' },
            color: 'purple',
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
