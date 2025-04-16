import React, { useState, useMemo } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IChatCardData } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

// Define interfaces for type safety
interface IGameCard {
    id: string;
    name: string;
    setId: { set: string; number: number };
    type?: string;
    uuid?: string;
}

interface IGamePlayer {
    leader?: IGameCard;
    cardPiles?: Record<string, IGameCard[]>;
}

const ChatDrawer: React.FC<IChatDrawerProps> = ({ sidebarOpen, toggleSidebar }) => {
    const { gameState, sendGameMessage, connectedPlayer } = useGame();
    const [chatMessage, setChatMessage] = useState('');

    // Extract card data from the game state
    const cardData = useMemo(() => {
        if (!gameState || !gameState.players) return {};

        const cards: Record<string, IChatCardData> = {};
        
        // Process all players' cards
        Object.values(gameState.players).forEach((player) => {
            const typedPlayer = player as IGamePlayer;
            
            // Process leader
            if (typedPlayer.leader && typedPlayer.leader.name) {
                cards[typedPlayer.leader.name] = {
                    id: typedPlayer.leader.id,
                    name: typedPlayer.leader.name,
                    setId: typedPlayer.leader.setId,
                    type: typedPlayer.leader.type || 'leader'
                };
            }

            // Process cards in different zones
            if (typedPlayer.cardPiles) {
                Object.values(typedPlayer.cardPiles).forEach((pile) => {
                    const typedPile = pile as IGameCard[];
                    if (Array.isArray(typedPile)) {
                        typedPile.forEach((card) => {
                            const typedCard = card as IGameCard;
                            if (typedCard && typedCard.name) {
                                cards[typedCard.name] = {
                                    id: typedCard.id,
                                    name: typedCard.name,
                                    setId: typedCard.setId,
                                    type: typedCard.type || 'card'
                                };
                            }
                        });
                    }
                });
            }
        });

        return cards;
    }, [gameState]);

    const handleGameChat = () => {
        if (chatMessage.trim()) {
            sendGameMessage(['chat', chatMessage]);
            setChatMessage('');
        }
    }

    // ------------------------STYLES------------------------//
    const styles = {
        drawerStyle: {
            flexShrink: 0,
            '& .MuiDrawer-paper': {
                backgroundColor: 'rgba(3, 12, 19, 0.9)',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                width: '380px',
                padding: '1em',
                overflow: 'hidden',
                border: 'none',
                borderLeft: '1px solid transparent',
                backgroundClip: 'padding-box',
                borderImage: 'linear-gradient(to bottom, #30434B, #50717D) 1',
                boxShadow: '-5px 0 15px rgba(0, 0, 0, 0.5)',
            },
        },
        headerBoxStyle: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5em',
        },
        closeButton: {
            color: 'var(--initiative-blue)',
            '&:hover': {
                color: 'var(--initiative-red)',
                backgroundColor: 'rgba(255, 50, 49, 0.1)',
            },
        }
    }

    return (
        <Drawer
            anchor="right"
            open={sidebarOpen}
            variant="persistent"
            sx={styles.drawerStyle}
        >
            <ChevronRightIcon 
                onClick={toggleSidebar} 
                sx={styles.closeButton}
            />
            <Box sx={styles.headerBoxStyle}>
                {/* <Typography variant="h3">
                    ROUND
                </Typography> */}
            </Box>

            {/* Use the ChatComponent here */}
            <Chat
                chatHistory={gameState.messages}
                chatMessage={chatMessage}
                setChatMessage={setChatMessage}
                handleChatSubmit={handleGameChat}
                cards={cardData}
            />
        </Drawer>
    );
};

export default ChatDrawer;
