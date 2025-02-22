import React from 'react';
import {
    Box,
    TextField,
    IconButton,
    InputAdornment,
    Divider,
    Typography,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { IChatProps, IChatEntry } from './ChatTypes';
import { useGame } from '@/app/_contexts/Game.context';

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
}) => {
    const { connectedPlayer } = useGame();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatMessage = (message: any, index: number) => {
        if (message.hasOwnProperty('alert')) {
            return (
                <Typography key={index} sx={styles.alertText}>
                    {message.alert.message.join('')}
                </Typography>
            )
        } else if (message[0].type === 'playerChat') {
            console.log(message[0])
            return (
                <Typography key={index} sx={styles.messageText}>
                    <Typography component="span" sx={{ color: connectedPlayer === message[0].id ? 'var(--initiative-blue)' : 'var(--initiative-red)' }}>
                        {message[0].name}
                    </Typography>:
                    {message.slice(1).join('')}
                </Typography>
            )
        }
        return (
            <Typography key={index} sx={styles.messageText}>
                {message[0].name} {message.slice(1).join('')}
            </Typography>
        )
    }
    // ------------------------STYLES------------------------//

    const styles = {
        chatContainer: {
            backgroundColor: '#28282800',
            overflowY: 'auto',
            height: '100%'
        },
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
            <Box sx={styles.chatContainer}>
                <Typography sx={styles.title}>Chat</Typography>
                <Divider sx={styles.divider} />
                <Box sx={styles.chatBox}>
                    {chatHistory && chatHistory.map((chatEntry: IChatEntry, index: number) => {
                        return formatMessage(chatEntry.message, index);
                    })}
                </Box>
            </Box>

            <Box sx={styles.inputContainer}>
                <TextField
                    variant="outlined"
                    placeholder="Chat"
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
            </Box>
        </>
    );
};

export default Chat;
