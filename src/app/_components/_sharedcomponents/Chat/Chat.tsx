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
import { IChatProps } from './ChatTypes';

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
}) => {
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
                    {/* {chatHistory.messages && chatHistory.messages.map((chatEntry, index) => {
                        // [ { name: 'Order66', email: null }, 'test', 'some message text' ]
                        // Extract the sender (an object with name) and the text
                        const [senderObject, _, text] = chatEntry.message;
                        return (
                            <Typography key={index} sx={messageTextStyle}>
                                {senderObject.name}: {text}
                            </Typography>
                        );
                    })} */}
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
