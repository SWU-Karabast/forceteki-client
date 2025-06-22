import { IChatObject, IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

// Type definitions for game state structure
interface IGameStatePlayer {
    leader?: IGameCard;
    base?: IGameCard;
    cardPiles?: Record<string, IGameCard[]>;
}

interface IGameCard {
    uuid: string;
    name?: string;
    controller?: { id: string };
    subcards?: IGameCard[];
}

interface IGameState {
    players: Record<string, IGameStatePlayer>;
}

/**
 * Enriches chat messages with card controller information
 * @param chatHistory - Array of chat entries
 * @param gameState - Current game state containing player and card information
 * @returns Enriched chat history with controller information
 */
export const enrichChatWithCardControllers = (
    chatHistory: IChatEntry[],
    gameState: IGameState | null
): IChatEntry[] => {
    if (!gameState || !gameState.players) {
        return chatHistory;
    }

    return chatHistory.map((chatEntry) => {
        try {
            // Skip if message doesn't exist or is not an array
            if (!chatEntry.message || !Array.isArray(chatEntry.message)) {
                return chatEntry;
            }

            // Process each item in the message array
            const enrichedMessage = chatEntry.message.map((item: unknown) => {
                // Check if item is a card object (has uuid and name properties) and hasn't been enriched yet
                if (typeof item === 'object' && item !== null && 'uuid' in item && 'name' in item && !('controller' in item)) {
                    const cardItem = item as { uuid: string; name: string; [key: string]: unknown };
                    // Find the card in the game state to get its controller at the time this message was created
                    const cardController = findCardController(cardItem.uuid, gameState);
                    
                    if (cardController) {
                        return {
                            ...cardItem,
                            controller: cardController
                        } as IChatObject;
                    }
                }
                return item;
            });

            return {
                ...chatEntry,
                message: enrichedMessage
            };
        } catch (error) {
            console.error('Error enriching chat message:', error);
            return chatEntry;
        }
    });
};

/**
 * Finds the controller of a card by its UUID in the game state
 * @param cardUuid - The UUID of the card to find
 * @param gameState - Current game state
 * @returns The player ID who controls the card, or null if not found
 */
const findCardController = (cardUuid: string, gameState: IGameState): string | null => {
    try {
        // Search through all players
        for (const playerId in gameState.players) {
            const player = gameState.players[playerId];
            
            // Check leader and base cards
            if (player.leader && player.leader.uuid === cardUuid) {
                return player.leader.controller?.id || playerId;
            }
            if (player.base && player.base.uuid === cardUuid) {
                return player.base.controller?.id || playerId;
            }
            
            // Check all card piles (hand, deck, discard, resources, etc.)
            if (player.cardPiles) {
                for (const zoneName in player.cardPiles) {
                    const zone = player.cardPiles[zoneName];
                    if (Array.isArray(zone)) {
                        for (const card of zone) {
                            if (card.uuid === cardUuid) {
                                return card.controller?.id || playerId;
                            }
                            // Check subcards if they exist
                            if (card.subcards && Array.isArray(card.subcards)) {
                                for (const subcard of card.subcards) {
                                    if (subcard.uuid === cardUuid) {
                                        return subcard.controller?.id || playerId;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error finding card controller:', error);
        return null;
    }
};

/**
 * Checks if a chat message contains card objects that need controller information
 * @param message - The chat message to check
 * @returns True if the message contains card objects
 */
export const messageContainsCards = (message: unknown): boolean => {
    if (!Array.isArray(message)) {
        return false;
    }
    
    return message.some((item: unknown) => 
        typeof item === 'object' && item !== null && 'uuid' in item && 'name' in item
    );
};
