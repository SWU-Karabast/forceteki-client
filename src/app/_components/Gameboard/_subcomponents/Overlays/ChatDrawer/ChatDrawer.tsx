import React, { useState, useMemo } from 'react';
import { Drawer, Box, Typography } from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import { IChatDrawerProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IChatCardData } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

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

    const cardData = useMemo(() => {
        if (!gameState || !gameState.players) return {};

        const cards: Record<string, IChatCardData> = {};
        
        Object.entries(gameState.players).forEach(([playerId, player]) => {
            const typedPlayer = player as IGamePlayer;
            
            if (typedPlayer.leader && typedPlayer.leader.name) {
                cards[typedPlayer.leader.name] = {
                    id: typedPlayer.leader.id,
                    name: typedPlayer.leader.name,
                    setId: typedPlayer.leader.setId,
                    type: typedPlayer.leader.type || 'leader',
                    ownerId: playerId
                };
            }

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
                                    type: typedCard.type || 'card',
                                    ownerId: playerId
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

    const styles = {
        drawerStyle: {
            flexShrink: 0,
            '& .MuiDrawer-paper': {
                backgroundColor: '#000000CC',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                width: '280px',
                padding: '1em',
                overflow: 'hidden',
            },
        },
        headerBoxStyle: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        }
    }

    

    return (
        <Drawer
            anchor="right"
            open={sidebarOpen}
            variant="persistent"
            sx={styles.drawerStyle}
        >
            <ChevronRightIcon onClick={toggleSidebar} />
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
