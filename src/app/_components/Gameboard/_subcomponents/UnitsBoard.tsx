import React from 'react';
import { Box, Grid2 as Grid } from '@mui/material';
import GameCard from '../../_sharedcomponents/Cards/GameCard';
import { ICardData, CardStyle } from '../../_sharedcomponents/Cards/CardTypes';
import { IUnitsBoardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';

const UnitsBoard: React.FC<IUnitsBoardProps> = ({
    arena
}) => {
    // ------------------------CONTEXT------------------------//
    /**
	 * Takes an array of cards which can be main units or upgrades,
	 * and returns a new array of only upgrades,
	 */
    const findUpgrades = (cards: ICardData[]): Record<string, ICardData[]> => {
        // Group upgrades by their parentCardId
        const upgradesByParentId: Record<string, ICardData[]> = {};

        cards.forEach((card) => {
            if (card.parentCardId) {
                // If this card is actually an upgrade that references a parent ID
                if (!upgradesByParentId[card.parentCardId]) {
                    upgradesByParentId[card.parentCardId] = [];
                }
                upgradesByParentId[card.parentCardId].push(card);
            }
        });
        return upgradesByParentId
    }

    /**
	 * Takes an array of cards which can be main units or upgrades,
	 * and returns a new array of only main cards,
	 * each including a subcards array with any matching upgrades.
	 */
    const attachUpgrades = (cards: ICardData[], upgradesByParentId: Record<string, ICardData[]>): ICardData[] => {
        // For each "main" card (has NO parentCardId), attach the subcards
        const mainCards = cards
            .filter((card) => !card.parentCardId)
            .map((card) => ({
                ...card,
                subcards: card.uuid ? upgradesByParentId[card.uuid] ?? [] : [], // attach any upgrades belonging to this card
            }));
        return mainCards;
    }

    /**
     * Takes an array of main unit cards and an array of captured cards,
     * and returns a new array of unit cards where each card has a `capturedCards`
     * property containing any captured cards that reference its uuid.
     */
    const attachCapturedCards = (
        cards: ICardData[],
        capturedCards: ICardData[]
    ): ICardData[] => {
        // Group captured cards by their parentCardId
        const capturedMapping: Record<string, ICardData[]> = {};

        capturedCards.forEach((card) => {
            if (card.parentCardId) {
                if (!capturedMapping[card.parentCardId]) {
                    capturedMapping[card.parentCardId] = [];
                }
                capturedMapping[card.parentCardId].push(card);
            }
        });

        // For each main unit card, attach any matching captured cards
        return cards.map((card) => ({
            ...card,
            capturedCards: card.uuid ? capturedMapping[card.uuid] ?? [] : [],
        }));
    };

    const { gameState, connectedPlayer, getOpponent } = useGame();

    const rawPlayerUnits = gameState?.players[connectedPlayer].cardPiles[arena];
    const rawOpponentUnits = gameState?.players[getOpponent(connectedPlayer)].cardPiles[arena];

    const playerCapturedCards = gameState?.players[connectedPlayer].cardPiles['capturedZone'];
    const opponentCapturedCards = gameState?.players[getOpponent(connectedPlayer)].cardPiles['capturedZone'];

    const allCardsInArena = [...rawPlayerUnits, ...rawOpponentUnits];
    const allCapturedCards = [...playerCapturedCards, ...opponentCapturedCards];

    const upgradeMapping = findUpgrades(allCardsInArena);

    // attach upgrades to the unit cards
    const playerUnitsWithUpgrades = attachUpgrades(rawPlayerUnits, upgradeMapping);
    const opponentUnitsWithUpgrades = attachUpgrades(rawOpponentUnits, upgradeMapping);

    // attach capturedCards to the unit cards
    const playerUnits = attachCapturedCards(playerUnitsWithUpgrades, allCapturedCards);
    const opponentUnits = attachCapturedCards(opponentUnitsWithUpgrades, allCapturedCards);

    const styles = {
        mainBoxStyle: {
            position: 'relative',
            height: '100%',
            width: '100%',
            padding: '3rem 2rem',
        },
        containerStyle: {
            height: '100%',
        },
        opponentGridStyle: {
            height: '50%',
            display: 'flex',
            justifyContent: arena == 'groundArena' ? 'flex-start': 'flex-end',
            alignItems: 'flex-start',
            gap: '10px',
            flexWrap: 'wrap',
        },
        playerGridStyle: {
            height: '50%',
            display: 'flex',
            justifyContent: arena == 'groundArena' ? 'flex-start': 'flex-end',
            alignItems: 'flex-end',
            gap: '10px',
            flexWrap: 'wrap',
        },
    };


    return (
        <Box sx={styles.mainBoxStyle}>
            <Grid container direction="column" sx={styles.containerStyle}>
                {/* Opponent's Ground Units */}
                <Grid sx={styles.opponentGridStyle}>
                    {opponentUnits.map((card: ICardData) => (
                        <Box key={card.uuid} sx={{ flex: '0 0 auto' }}>
                            <GameCard key={card.uuid} card={card} subcards={card.subcards} capturedCards={card.capturedCards} cardStyle={CardStyle.InPlay}/>
                        </Box>
                    ))}
                </Grid>

                {/* Player's Ground Units */}
                <Grid sx={styles.playerGridStyle}>
                    {playerUnits.map((card: ICardData) => (
                        <Box key={card.uuid} sx={{ flex: '0 1 auto' }}>
                            <GameCard key={card.uuid} card={card} subcards={card.subcards} capturedCards={card.capturedCards} cardStyle={CardStyle.InPlay}/>
                        </Box>
                    ))}
                </Grid>
            </Grid>
        </Box>
    );
};

export default UnitsBoard;