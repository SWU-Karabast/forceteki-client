import React, { useEffect, useRef, useState } from 'react';
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
import { enrichChatWithCardControllers } from '@/app/_utils/chatUtils';

const Chat: React.FC<IChatProps> = ({
    chatHistory,
    chatMessage,
    setChatMessage,
    handleChatSubmit,
}) => {
    const { connectedPlayer, isSpectator, getOpponent, gameState } = useGame();
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const [enrichedChatHistory, setEnrichedChatHistory] = useState<IChatEntry[]>([]);
    const lastChatLengthRef = useRef<number>(0);

    // Enrich chat history with card controller information only for new messages
    useEffect(() => {
        if (!gameState || !chatHistory) {
            setEnrichedChatHistory(chatHistory || []);
            return;
        }

        // Check if we have new messages
        if (chatHistory.length > lastChatLengthRef.current) {
            // Get only the new messages that need enrichment
            const newMessages = chatHistory.slice(lastChatLengthRef.current);
            const enrichedNewMessages = enrichChatWithCardControllers(newMessages, gameState);
            
            // Combine existing enriched messages with newly enriched messages
            setEnrichedChatHistory(prev => [...prev, ...enrichedNewMessages]);
            lastChatLengthRef.current = chatHistory.length;
        } else if (chatHistory.length < lastChatLengthRef.current) {
            // Chat history was reset (e.g., new game), re-enrich all messages
            const fullyEnrichedHistory = enrichChatWithCardControllers(chatHistory, gameState);
            setEnrichedChatHistory(fullyEnrichedHistory);
            lastChatLengthRef.current = chatHistory.length;
        }
    }, [chatHistory, gameState]);

    // Function to get player names that actually appear in chat logs
    const getPlayerUsernames = (): { currentPlayerName: string; opponentName: string } => {
        if (!gameState?.players) {
            console.log('No gameState or players available');
            return { currentPlayerName: '', opponentName: '' };
        }

        const opponentId = getOpponent(connectedPlayer);
        
        // Extract the actual usernames that appear in chat messages
        const currentPlayerName = (gameState.players[connectedPlayer] as { user?: { username: string } })?.user?.username || '';
        const opponentName = (gameState.players[opponentId] as { user?: { username: string } })?.user?.username || '';

        console.log('Player names for chat matching:', {
            connectedPlayer,
            opponentId,
            currentPlayerName,
            opponentName,
            gameStatePlayers: Object.keys(gameState.players),
            currentPlayerData: gameState.players[connectedPlayer],
            opponentPlayerData: gameState.players[opponentId]
        });

        return { currentPlayerName, opponentName };
    };

    // Function to style player names in text
    const stylePlayerNamesInText = (text: string): React.ReactNode => {
        if (typeof text !== 'string' || !gameState?.players) {
            return text;
        }

        const { currentPlayerName, opponentName } = getPlayerUsernames();
        
        if (!currentPlayerName && !opponentName) {
            return text;
        }

        // Create a regex that matches either player name
        const playerNames = [currentPlayerName, opponentName].filter(name => name);
        if (playerNames.length === 0) {
            return text;
        }

        const escapedNames = playerNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const regex = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'g');
        
        const parts = text.split(regex);
        
        return parts.map((part, index) => {
            if (playerNames.includes(part)) {
                const isCurrentPlayer = part === currentPlayerName;
                const color = isCurrentPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)';
                const displayName = isSpectator 
                    ? (isCurrentPlayer ? 'Player 1' : 'Player 2')
                    : part;
                
                return (
                    <span 
                        key={index} 
                        style={{ color, fontWeight: 'bold' }}
                    >
                        {displayName}
                    </span>
                );
            }
            return part;
        });
    };

    // Function to format message items, handling spectator view and card styling
    const formatMessageItem = (item: IChatObject | string | number) => {
        if (typeof item === 'object') {
            let displayName = item.name;
            
            // If user is a spectator, show Player 1/Player 2 instead of names
            if (isSpectator && item.id) {
                displayName = item.id === connectedPlayer ? 'Player 1' : item.id === getOpponent(connectedPlayer) ? 'Player 2' : item.name;
            }
            
            // Apply card controller styling if controller information is available
            if (item.controller) {
                const isPlayerControlled = item.controller === connectedPlayer;
                const color = isPlayerControlled ? 'var(--initiative-blue)' : 'var(--initiative-red)';
                return `<span style="color: ${color}; font-weight: bold;">${displayName}</span>`;
            }
            
            return displayName;
        }
        // If not an object, apply player name styling to strings
        if (typeof item === 'string') {
            const { currentPlayerName, opponentName } = getPlayerUsernames();
            let styledString = item;
            
            // Style current player name
            if (currentPlayerName && styledString.includes(currentPlayerName)) {
                const displayName = isSpectator ? 'Player 1' : currentPlayerName;
                const regex = new RegExp(`\\b${currentPlayerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                styledString = styledString.replace(regex, `<span style="color: var(--initiative-blue); font-weight: bold;">${displayName}</span>`);
            }
            
            // Style opponent name
            if (opponentName && styledString.includes(opponentName)) {
                const displayName = isSpectator ? 'Player 2' : opponentName;
                const regex = new RegExp(`\\b${opponentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                styledString = styledString.replace(regex, `<span style="color: var(--initiative-red); font-weight: bold;">${displayName}</span>`);
            }
            
            return styledString;
        }
        if (typeof item === 'number') {
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
                        <span style={{ color: connectedPlayer === message[0].id ? 'var(--initiative-blue)' : 'var(--initiative-red)' }}>
                            {isSpectator ? connectedPlayer === message[0].id ? 'Player 1' : 'Player 2' : message[0].name}
                        </span>
                        : {message.slice(1).join('')}
                    </Typography>
                )
            } else {
                messageText = message;
                textStyle = styles.messageText;
            }
            
            console.log('Processing message with items:', messageText);
            console.log('Full message structure:', JSON.stringify(messageText, null, 2));
            
            const formattedItems = messageText.map((item: unknown, itemIndex: number) => {
                console.log(`Item ${itemIndex}:`, { type: typeof item, value: item });
                if (typeof item === 'object' && item !== null) {
                    console.log(`Object details for item ${itemIndex}:`, JSON.stringify(item, null, 2));
                }
                
                if (typeof item === 'object' && item !== null && 'controller' in item) {
                    // Handle card objects with controller styling
                    const cardItem = item as IChatObject;
                    let displayName = cardItem.name;
                    
                    // If user is a spectator, show Player 1/Player 2 instead of names
                    if (isSpectator && cardItem.id) {
                        displayName = cardItem.id === connectedPlayer ? 'Player 1' : cardItem.id === getOpponent(connectedPlayer) ? 'Player 2' : cardItem.name;
                    }
                    
                    const isPlayerControlled = cardItem.controller === connectedPlayer;
                    const color = isPlayerControlled ? 'var(--initiative-blue)' : 'var(--initiative-red)';
                    
                    return (
                        <span key={itemIndex} style={{ color, fontWeight: 'bold' }}>
                            {displayName}
                        </span>
                    );
                } else if (typeof item === 'object' && item !== null && 'name' in item && !('controller' in item)) {
                    // Handle player objects (objects with name but no controller)
                    const playerItem = item as { id?: string; name: string; label?: string };
                    const { currentPlayerName, opponentName } = getPlayerUsernames();
                    
                    // Check if this object represents a player by matching the name
                    if (playerItem.name === currentPlayerName || playerItem.name === opponentName) {
                        console.log(`Found player object for "${playerItem.name}"`);
                        const isCurrentPlayer = playerItem.name === currentPlayerName;
                        const color = isCurrentPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)';
                        const displayName = isSpectator 
                            ? (isCurrentPlayer ? 'Player 1' : 'Player 2')
                            : playerItem.name;
                        
                        return (
                            <span key={itemIndex} style={{ color, fontWeight: 'bold' }}>
                                {displayName}
                            </span>
                        );
                    } else {
                        // Not a player object, render normally
                        return playerItem.name;
                    }
                } else if (typeof item === 'string') {
                    // Handle string items - apply player name styling and render HTML
                    const { currentPlayerName, opponentName } = getPlayerUsernames();
                    let styledString = item;
                    
                    console.log('Processing string item:', {
                        originalString: item,
                        currentPlayerName,
                        opponentName,
                        includesCurrentPlayer: currentPlayerName ? styledString.includes(currentPlayerName) : false,
                        includesOpponent: opponentName ? styledString.includes(opponentName) : false
                    });
                    
                    // Style current player name
                    if (currentPlayerName && styledString.includes(currentPlayerName)) {
                        console.log(`Found current player name "${currentPlayerName}" in string "${styledString}"`);
                        const displayName = isSpectator ? 'Player 1' : currentPlayerName;
                        const regex = new RegExp(`\\b${currentPlayerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                        const beforeReplace = styledString;
                        styledString = styledString.replace(regex, `<span style="color: var(--initiative-blue); font-weight: bold;">${displayName}</span>`);
                        console.log(`Replaced current player: "${beforeReplace}" -> "${styledString}"`);
                    }
                    
                    // Style opponent name
                    if (opponentName && styledString.includes(opponentName)) {
                        console.log(`Found opponent name "${opponentName}" in string "${styledString}"`);
                        const displayName = isSpectator ? 'Player 2' : opponentName;
                        const regex = new RegExp(`\\b${opponentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
                        const beforeReplace = styledString;
                        styledString = styledString.replace(regex, `<span style="color: var(--initiative-red); font-weight: bold;">${displayName}</span>`);
                        console.log(`Replaced opponent: "${beforeReplace}" -> "${styledString}"`);
                    }
                    
                    // If the string contains HTML styling, render it with dangerouslySetInnerHTML
                    if (styledString.includes('<span')) {
                        console.log('Rendering styled string with dangerouslySetInnerHTML:', styledString);
                        return (
                            <span 
                                key={itemIndex} 
                                dangerouslySetInnerHTML={{ __html: styledString }}
                            />
                        );
                    } else {
                        console.log('Returning plain string:', styledString);
                        return styledString;
                    }
                } else {
                    // Handle regular text items
                    const textItem = item as IChatObject | string | number;
                    return formatMessageItem(textItem);
                }
            });
            
            return (
                <Typography key={index} sx={textStyle}>
                    {formattedItems}
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
    }, [enrichedChatHistory]);
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
                {enrichedChatHistory && enrichedChatHistory.map((chatEntry: IChatEntry, index: number) => {
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
