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
                    {processMessageContent(chatContent)}
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
                    {processMessageContent(stringMessage)}
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
        },
    };

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

            {/* Card Preview Popover */}
            <Popover
                id="card-preview-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={hoveredCard.element}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: -5,
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
