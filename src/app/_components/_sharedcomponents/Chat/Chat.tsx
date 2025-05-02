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
    const { connectedPlayer, isSpectator, gameState } = useGame();
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

    const getOpponentName = () => {
        const opponent = gameState?.players ? Object.keys(gameState.players).find(id => id !== connectedPlayer) : '';
        return opponent || '';
    };
    
    const opponentId = getOpponentName();
    
    const playerNames = React.useMemo(() => {
        const names: Record<string, string> = {};
        
        if (chatHistory && chatHistory.length > 0) {
            chatHistory.forEach(entry => {
                const { message } = entry;
                
                if (Array.isArray(message) && message.length > 0 && message[0].type === 'playerChat') {
                    const playerName = message[0].name || '';
                    const playerId = message[0].id || '';
                    
                    if (playerName && playerId) {
                        names[playerName] = playerId;
                    }
                }
            });
        }
        
        if (gameState && gameState.players) {
            Object.entries(gameState.players).forEach(([playerId, playerData]) => {
                if (playerData && typeof playerData === 'object') {
                    const player = playerData as Record<string, unknown>;
                    if (player.name && typeof player.name === 'string') {
                        names[player.name as string] = playerId;
                    } else if (player.username && typeof player.username === 'string') {
                        names[player.username as string] = playerId;
                    } else if (player.displayName && typeof player.displayName === 'string') {
                        names[player.displayName as string] = playerId;
                    }
                }
            });
        }
        
        return names;
    }, [chatHistory, gameState, connectedPlayer]);

    const findAllOccurrences = (str: string, substr: string): number[] => {
        const result: number[] = [];
        let index = str.toLowerCase().indexOf(substr.toLowerCase());
        while (index !== -1) {
            result.push(index);
            index = str.toLowerCase().indexOf(substr.toLowerCase(), index + 1);
        }
        return result;
    };

    const isPositionOverlapping = (
        position: number, 
        length: number, 
        positionMap: Record<number, { length: number, element: JSX.Element }>
    ): boolean => {
        return Object.keys(positionMap).some(pos => {
            const p = parseInt(pos);
            return (position >= p && position < p + positionMap[p].length) ||
                   (position + length > p && position < p);
        });
    };

    const createCardElement = (
        card: IChatCardData, 
        isCurrentPlayerCard: boolean, 
        content: string, 
        position: number
    ): JSX.Element => {
        return (
            <Typography
                component="span"
                sx={{
                    color: isCurrentPlayerCard ? 'var(--initiative-blue)' : 'var(--initiative-red)',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    '&:hover': {
                        color: 'purple',
                    }
                }}
                onMouseEnter={(e) => handleCardPreviewOpen(e, card)}
                onMouseLeave={handleCardPreviewClose}
            >
                {content.substring(position, position + card.name.length)}
            </Typography>
        );
    };

    const createPlayerNameElement = (
        playerName: string, 
        isCurrentPlayer: boolean, 
        content: string, 
        position: number
    ): JSX.Element => {
        return (
            <Typography
                component="span"
                sx={{
                    color: isCurrentPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)',
                    fontWeight: 'bold'
                }}
            >
                {content.substring(position, position + playerName.length)}
            </Typography>
        );
    };

    const determineCardToUse = (
        cardName: string,
        cardsByOwner: Record<string, IChatCardData>,
        contentBeforeCard: string,
        position: number,
        occurrences: number[]
    ): { card: IChatCardData, isCurrentPlayerCard: boolean } => {
        let cardToUse: IChatCardData | null = null;
        let isCurrentPlayerCard = false;
        
        if (Object.keys(cardsByOwner).length > 1) {
            let foundOwner = false;
            
            Object.entries(playerNames).forEach(([playerName, playerId]) => {
                if (contentBeforeCard.includes(playerName) && cardsByOwner[playerId]) {
                    cardToUse = cardsByOwner[playerId];
                    isCurrentPlayerCard = playerId === connectedPlayer;
                    foundOwner = true;
                }
            });
            
            if (!foundOwner) {
                const isAttackMessage = contentBeforeCard.includes('attacks') || 
                                       contentBeforeCard.includes('targets') ||
                                       contentBeforeCard.includes('uses');
                
                if (isAttackMessage) {
                    const isFirstOccurrence = occurrences.indexOf(position) === 0;
                    
                    if (isFirstOccurrence && cardsByOwner[connectedPlayer]) {
                        cardToUse = cardsByOwner[connectedPlayer];
                        isCurrentPlayerCard = true;
                    } else if (!isFirstOccurrence && cardsByOwner[opponentId]) {
                        cardToUse = cardsByOwner[opponentId];
                        isCurrentPlayerCard = false;
                    }
                }
            }
        }
        
        if (!cardToUse) {
            const firstOwnerId = Object.keys(cardsByOwner)[0];
            cardToUse = cardsByOwner[firstOwnerId];
            isCurrentPlayerCard = firstOwnerId === connectedPlayer;
        }
        
        return { card: cardToUse, isCurrentPlayerCard };
    };

    const processMessageContent = (content: string) => {
        if ((!cards || Object.keys(cards).length === 0) && 
            (!playerNames || Object.keys(playerNames).length === 0)) {
            return content;
        }

        const positionMap: Record<number, { length: number, element: JSX.Element }> = {};

        const cardNameMap: Record<string, Record<string, IChatCardData>> = {};
        
        Object.entries(cards).forEach(([key, card]) => {
            const cardName = card.name;
            if (!cardNameMap[cardName]) {
                cardNameMap[cardName] = {};
            }
            cardNameMap[cardName][card.ownerId || ''] = card;
        });

        Object.keys(cardNameMap).forEach(cardName => {
            const occurrences = findAllOccurrences(content, cardName);
            
            occurrences.forEach(position => {
                if (!isPositionOverlapping(position, cardName.length, positionMap)) {
                    const contentBeforeCard = content.substring(0, position);
                    
                    const { card, isCurrentPlayerCard } = determineCardToUse(
                        cardName,
                        cardNameMap[cardName],
                        contentBeforeCard,
                        position,
                        occurrences
                    );
                    
                    if (card) {
                        positionMap[position] = {
                            length: cardName.length,
                            element: createCardElement(card, isCurrentPlayerCard, content, position)
                        };
                    }
                }
            });
        });

        Object.keys(playerNames).forEach(playerName => {
            const occurrences = findAllOccurrences(content, playerName);
            
            occurrences.forEach(position => {
                if (!isPositionOverlapping(position, playerName.length, positionMap)) {
                    const playerId = playerNames[playerName];
                    const isCurrentPlayer = playerId === connectedPlayer;
                    
                    positionMap[position] = {
                        length: playerName.length,
                        element: createPlayerNameElement(playerName, isCurrentPlayer, content, position)
                    };
                }
            });
        });

        if (Object.keys(positionMap).length === 0) {
            return content;
        }

        return buildStyledContent(content, positionMap);
    };

    const buildStyledContent = (
        content: string, 
        positionMap: Record<number, { length: number, element: JSX.Element }>
    ): JSX.Element[] => {
        const positions = Object.keys(positionMap).map(Number).sort((a, b) => a - b);

        const result: JSX.Element[] = [];
        let lastPosition = 0;

        positions.forEach((position, index) => {
            if (position > lastPosition) {
                result.push(
                    <React.Fragment key={`text-${index}`}>
                        {content.substring(lastPosition, position)}
                    </React.Fragment>
                );
            }

            result.push(React.cloneElement(positionMap[position].element, { key: `styled-${index}` }));

            lastPosition = position + positionMap[position].length;
        });

        if (lastPosition < content.length) {
            result.push(
                <React.Fragment key={`text-${positions.length}`}>
                    {content.substring(lastPosition)}
                </React.Fragment>
            );
        }

        return result;
    };

    const formatMessage = (entry: IChatEntry, index: number) => {
        const { message } = entry;
        
        if ('alert' in message) {
            return (
                <Typography key={index} sx={styles.alertText}>
                    {message.alert.message.join('')}
                </Typography>
            );
        }
        
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
                            color: isCurrentPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)',
                            fontWeight: 'bold'
                        }}
                    >
                        {playerName}
                    </Typography>:
                    {processMessageContent(chatContent)}
                </Typography>
            );
        }
        
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
        
        return null;
    }

    useEffect(() => {
        if(chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory]);

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
            color: 'purple',
            fontWeight: 'bold'
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
                '& fieldset': {
                    borderColor: '#fff',
                },
            },
            '& .MuiOutlinedInput-root.Mui-focused': {
                '& fieldset': {
                    borderColor: '#fff',
                },
            },
        }
    }

    const cardPreviewStyles = {
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            width: '16rem',
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
                slotProps={{ paper: { sx: { backgroundColor: 'transparent' } } }}
            >
                {hoveredCard.card && (
                    <Box sx={{
                        ...cardPreviewStyles.cardPreview,
                        aspectRatio: hoveredCard.card.zone === 'base' ? '1.4 / 1' : '1 / 1.4',
                        backgroundImage: `url(${s3CardImageURL(hoveredCard.card, 
                            hoveredCard.card.type === 'leader' && hoveredCard.card.zone === 'base' 
                                ? CardStyle.PlainLeader 
                                : CardStyle.Plain
                        )})`,
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
