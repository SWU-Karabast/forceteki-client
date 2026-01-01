/**
 * Utility functions for interacting with gameState
 */

type Player = {
    cardPiles: Record<string, Card[]>
}

type GameState = {
    players: Record<string, Player>
}

type Card = {
    selected: boolean | undefined
}

/**
 * Check if there are selected cards
 * @param gameState The current gameState
 * @param arenas Arenas to check
 * @returns True if there are any selected cards in arenas
 */
export const hasSelectedCards = (gameState: GameState, arenas: string[]): boolean => {
    let hasSelectedCards = false;
    for (const player in gameState.players) {
        if (!gameState.players.hasOwnProperty(player)){
            continue;
        }
        for (const arena of arenas) {
            hasSelectedCards ||= gameState.players[player].cardPiles[arena]?.some((card: Card) => card.selected)
        }
    }

    return hasSelectedCards;
}