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
    const { connectedPlayer, isSpectator } = useGame();
    const chatEndRef = useRef<HTMLDivElement | null>(null);


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
                        <Typography component="span" sx={{ color: connectedPlayer === message[0].id ? 'var(--initiative-blue)' : 'var(--initiative-red)' }}>
                            {message[0].name}
                        </Typography>:
                        {message.slice(1).join('')}
                    </Typography>
                )
            }
            const stringMessage = message.map((item: IChatObject | string) => typeof item === 'object' ? item?.name : item).join('');
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
            p: '0.5em',
            minHeight: '100px',
            overflowY: 'auto',
            backgroundColor: '#28282800',
            flex: 1,
        },
        messageText: {
            fontSize: '.9em',
            color: '#fff',
        },
        alertText: {
            fontSize: '1em',
            color: 'purple'
        },
        inputContainer: {
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#28282800',
            p: '0.5em',
            mb: 2,
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
