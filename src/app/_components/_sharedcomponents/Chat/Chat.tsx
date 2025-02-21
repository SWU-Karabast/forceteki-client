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

    const chatContainerStyle = {
        backgroundColor: '#28282800',
        height: '55vh',
        overflowY: 'auto',
    };

    const titleStyle = {
        fontWeight: 'bold',
        color: '#fff',
        fontSize: '1.5em',
    };

    const dividerStyle = {
        backgroundColor: '#fff',
        mt: '.5vh',
        mb: '0.5vh',
    };

    const chatBoxStyle = {
        p: '10px',
        borderRadius: '4px',
        minHeight: '100px',
        overflowY: 'auto',
        backgroundColor: '#28282800',
    };

    const messageTextStyle = {
        color: '#fff',
    };

    const inputContainerStyle = {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#28282800',
        p: '10px',
        mt: 2,
    };
    const textFieldStyle = {
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
    };

    return (
        <>
            <Box sx={chatContainerStyle}>
                <Typography sx={titleStyle}>Chat</Typography>
                <Divider sx={dividerStyle} />
                <Box sx={chatBoxStyle}>
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

            <Box sx={inputContainerStyle}>
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
                    sx={textFieldStyle}
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
