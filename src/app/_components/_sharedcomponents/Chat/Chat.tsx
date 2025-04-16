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
import { IChatProps, IChatEntry, IChatMessageContent, MessageType } from './ChatTypes';
import { useGame } from '@/app/_contexts/Game.context';

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
}) => {
    const { connectedPlayer, isSpectator } = useGame();
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const formatMessage = (entry: IChatEntry, index: number) => {
        const { message } = entry;
        
        // Handle alert messages
        if ('alert' in message) {
            return (
                <Typography key={index} sx={styles.alertText}>
                    {message.alert.message.join('')}
                </Typography>
            );
        }
        
        // Handle player chat messages
        if (Array.isArray(message) && message.length > 0 && message[0].type === 'playerChat') {
            const playerName = message[0].name || '';
            const playerId = message[0].id || '';
            const isCurrentPlayer = connectedPlayer === playerId;
            const chatContent = message.slice(1).join('');
            
            return (
                <Typography key={index} sx={styles.messageText}>
                    <Typography 
                        component="span" 
                        sx={{ 
                            color: isCurrentPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)' 
                        }}
                    >
                        {playerName}
                    </Typography>:
                    {chatContent}
                </Typography>
            );
        }
        
        // Handle game log messages
        if (Array.isArray(message)) {
            const stringMessage = message.map(item => 
                typeof item === 'object' ? item?.name || '' : item
            ).join('');
            
            return (
                <Typography key={index} sx={styles.messageText}>
                    {stringMessage}
                </Typography>
            );
        }
        
        // Fallback for unexpected message format
        return null;
    }

    useEffect(() => {
        if(chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]);
    // ------------------------STYLES------------------------//

    const styles = {
        title: {
            fontWeight: 'bold',
            color: '#fff',
            fontSize: '1.5em',
        },
        divider: {
            backgroundColor: '#fff',
            mt: '.5vh',
            mb: '0.5vh',
        },
        chatBox: {
            p: '10px',
            borderRadius: '4px',
            minHeight: '100px',
            overflowY: 'auto',
            backgroundColor: '#28282800',
            flex: 1,
        },
        messageText: {
            color: '#fff',
        },
        alertText: {
            color: 'purple'
        },
        inputContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#28282800',
            p: '10px',
            mt: 2,
        },
        textField: {
            backgroundColor: '#28282800',
            color: '#fff',
            borderRadius: '4px',
            flexGrow: 1,
            input: { color: '#fff' },
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
            <Typography sx={styles.title}>Chat</Typography>
            <Divider sx={styles.divider} />
            <Box sx={styles.chatBox}>
                {chatHistory && chatHistory.map((chatEntry: IChatEntry, index: number) => {
                    return formatMessage(chatEntry, index);
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
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={handleChatSubmit}>
                                            <Send sx={{ color: '#fff' }} />
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
