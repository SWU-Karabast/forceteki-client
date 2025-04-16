import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    TextField,
    IconButton,
    InputAdornment,
    Divider,
    Typography,
    Popover,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { IChatProps, IChatEntry, IChatMessageContent, MessageType, IChatCardData } from './ChatTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
    cards = {},
}) => {
    const { connectedPlayer, isSpectator } = useGame();
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const [hoveredCard, setHoveredCard] = useState<{ 
        element: HTMLElement | null, 
        card: IChatCardData | null 
    }>({ element: null, card: null });
    const hoverTimeout = useRef<number | undefined>(undefined);
    const open = Boolean(hoveredCard.element);

    const handleCardPreviewOpen = (event: React.MouseEvent<HTMLElement>, card: IChatCardData) => {
        const target = event.currentTarget;
        hoverTimeout.current = window.setTimeout(() => {
            setHoveredCard({ element: target, card });
        }, 200);
    };
        
    const handleCardPreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setHoveredCard({ element: null, card: null });
    };

    // Function to identify card names in a message and wrap them with hover functionality
    const processMessageContent = (content: string) => {
        if (!cards || Object.keys(cards).length === 0) {
            return content;
        }

        // Create an array of card names sorted by length (longest first)
        // This ensures that longer card names are matched before shorter ones
        // (e.g. "Darth Vader" before "Vader")
        const cardNames = Object.keys(cards).sort((a, b) => b.length - a.length);
        
        // Split the content into parts that are either card names or regular text
        const parts: JSX.Element[] = [];
        let remainingContent = content;
        let key = 0;
        
        // Process each card name
        cardNames.forEach(cardName => {
            const cardNameRegex = new RegExp(`\\b${cardName}\\b`, 'gi');
            let match;
            let lastIndex = 0;
            const tempContent = remainingContent;
            remainingContent = '';
            
            // Find all occurrences of the card name
            while ((match = cardNameRegex.exec(tempContent)) !== null) {
                // Add the text before the match
                if (match.index > lastIndex) {
                    parts.push(
                        <React.Fragment key={key++}>
                            {tempContent.substring(lastIndex, match.index)}
                        </React.Fragment>
                    );
                }
                
                // Add the card name with hover functionality
                const card = cards[cardName];
                parts.push(
                    <Typography
                        key={key++}
                        component="span"
                        sx={{
                            color: 'var(--initiative-blue)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            '&:hover': {
                                color: 'var(--initiative-red)',
                            }
                        }}
                        onMouseEnter={(e) => handleCardPreviewOpen(e, card)}
                        onMouseLeave={handleCardPreviewClose}
                    >
                        {match[0]}
                    </Typography>
                );
                
                lastIndex = match.index + match[0].length;
            }
            
            // Add the remaining text
            if (lastIndex < tempContent.length) {
                remainingContent += tempContent.substring(lastIndex);
            }
        });
        
        // Add any remaining content
        if (remainingContent) {
            parts.push(
                <React.Fragment key={key++}>
                    {remainingContent}
                </React.Fragment>
            );
        }
        
        return parts.length > 0 ? parts : content;
    };

    // Format timestamp in Star Wars style
    const formatTimestamp = (dateString: string) => {
        const date = new Date(dateString);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const formatMessage = (entry: IChatEntry, index: number) => {
        const { message, date } = entry;
        const timestamp = formatTimestamp(date);
        
        // Handle alert messages
        if ('alert' in message) {
            return (
                <Box key={index} sx={styles.messageContainer}>
                    <Typography component="span" sx={styles.timestamp}>
                        [{timestamp}]
                    </Typography>
                    <Typography component="span" sx={styles.alertText}>
                        {message.alert.message.join('')}
                    </Typography>
                </Box>
            );
        }
        
        // Handle player chat messages
        if (Array.isArray(message) && message.length > 0 && message[0].type === 'playerChat') {
            const playerName = message[0].name || '';
            const playerId = message[0].id || '';
            const isCurrentPlayer = connectedPlayer === playerId;
            const chatContent = message.slice(1).join('');
            
            return (
                <Box key={index} sx={styles.messageContainer}>
                    <Typography component="span" sx={styles.timestamp}>
                        [{timestamp}]
                    </Typography>
                    <Typography 
                        component="span" 
                        sx={{
                            ...styles.messageText,
                            fontWeight: 'bold'
                        }}
                    >
                        <Typography 
                            component="span" 
                            sx={{ 
                                color: isCurrentPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)',
                                fontWeight: 'bold',
                                mr: 0.5
                            }}
                        >
                            {playerName}:
                        </Typography>
                        {processMessageContent(chatContent)}
                    </Typography>
                </Box>
            );
        }
        
        // Handle game log messages
        if (Array.isArray(message)) {
            const stringMessage = message.map(item => 
                typeof item === 'object' ? item?.name || '' : item
            ).join('');
            
            return (
                <Box key={index} sx={styles.messageContainer}>
                    <Typography component="span" sx={styles.timestamp}>
                        [{timestamp}]
                    </Typography>
                    <Typography component="span" sx={styles.gameLogText}>
                        {processMessageContent(stringMessage)}
                    </Typography>
                </Box>
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
            color: 'var(--initiative-blue)',
            fontSize: '1.5em',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 0 5px rgba(0, 186, 255, 0.7)',
        },
        divider: {
            background: 'linear-gradient(to right, transparent, var(--initiative-blue), transparent)',
            height: '2px',
            mt: '.5vh',
            mb: '0.5vh',
        },
        chatBox: {
            p: '10px',
            borderRadius: '8px',
            minHeight: '100px',
            overflowY: 'auto',
            backgroundColor: 'rgba(15, 31, 39, 0.7)',
            flex: 1,
            border: '1px solid transparent',
            background: 'linear-gradient(rgba(15, 31, 39, 0.7), rgba(3, 12, 19, 0.7)) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            boxShadow: 'inset 0 0 10px rgba(0, 186, 255, 0.2)',
            '&::-webkit-scrollbar': {
                width: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'var(--initiative-blue)',
                borderRadius: '2px',
            },
        },
        messageContainer: {
            display: 'flex',
            alignItems: 'flex-start',
            my: 0.5,
            px: 1,
            borderRadius: '4px',
            '&:hover': {
                backgroundColor: 'rgba(0, 186, 255, 0.1)',
            },
        },
        timestamp: {
            color: '#8A8A8A',
            fontFamily: 'monospace',
            fontSize: '0.8em',
            fontWeight: 500,
            mr: 1,
            minWidth: '70px',
        },
        messageText: {
            color: '#E0E0E0',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            fontWeight: 500,
            flex: 1,
        },
        gameLogText: {
            color: '#C0C0C0',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            fontStyle: 'italic',
            fontWeight: 500,
            flex: 1,
        },
        alertText: {
            color: 'var(--initiative-red)',
            fontWeight: 'bold',
            textShadow: '0 0 5px rgba(255, 50, 49, 0.7)',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            flex: 1,
        },
        inputContainer: {
            display: 'flex',
            alignItems: 'center',
            p: '10px',
            mt: 2,
            borderRadius: '8px',
            border: '1px solid transparent',
            background: 'linear-gradient(rgba(15, 31, 39, 0.7), rgba(3, 12, 19, 0.7)) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
        },
        textField: {
            backgroundColor: 'transparent',
            color: '#fff',
            borderRadius: '4px',
            flexGrow: 1,
            input: { 
                color: '#fff',
                fontFamily: 'monospace',
            },
            '& .MuiOutlinedInput-root': {
                '& fieldset': {
                    borderColor: 'var(--initiative-blue)',
                    borderWidth: '1px',
                },
                '&:hover fieldset': {
                    borderColor: 'var(--initiative-blue)',
                    borderWidth: '1px',
                },
            },
            '& .MuiOutlinedInput-root.Mui-focused': {
                '& fieldset': {
                    borderColor: 'var(--initiative-blue)',
                    boxShadow: '0 0 5px var(--initiative-blue)',
                },
            },
        }
    }

    // Add card preview styles
    const cardPreviewStyles = {
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'contain', // Changed from 'cover' to 'contain'
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            aspectRatio: '1.4 / 1',
            width: '24rem',
            height: '17.14rem', // Added explicit height based on aspect ratio
            marginRight: '-10px', // Move the preview closer to the word
        },
    };

    return (
        <>
            <Typography sx={styles.title}>CHAT</Typography>
            <Divider sx={styles.divider} />
            <Box sx={styles.chatBox}>
                {chatHistory && chatHistory.map((chatEntry: IChatEntry, index: number) => {
                    return formatMessage(chatEntry, index);
                })}
                <Box ref={chatEndRef} />
            </Box>

            {/* Card Preview Popover */}
            <Popover
                id="card-preview-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={hoveredCard.element}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                }}
                onClose={handleCardPreviewClose}
                disableRestoreFocus
                slotProps={{ 
                    paper: { 
                        sx: { 
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                            border: 'none',
                            overflow: 'visible'
                        } 
                    } 
                }}
            >
                {hoveredCard.card && (
                    <Box sx={{
                        ...cardPreviewStyles.cardPreview,
                        backgroundImage: `url(${s3CardImageURL(hoveredCard.card, CardStyle.Plain)})`,
                    }} />
                )}
            </Popover>

            <Box sx={styles.inputContainer}>
                {!isSpectator &&(
                    <TextField
                        variant="outlined"
                        placeholder="Enter message..."
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
                                        <IconButton 
                                            onClick={handleChatSubmit}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'rgba(0, 186, 255, 0.2)',
                                                }
                                            }}
                                        >
                                            <Send sx={{ color: 'var(--initiative-blue)' }} />
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
