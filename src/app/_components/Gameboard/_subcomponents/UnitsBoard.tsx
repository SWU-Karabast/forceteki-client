import React from 'react';
import { Box, Grid2 as Grid } from '@mui/material';
import { debugBorder, isBreakpointOverlayEnabled } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import GameCard from '../../_sharedcomponents/Cards/GameCard';
import { ICardData, CardStyle } from '../../_sharedcomponents/Cards/CardTypes';
import { IUnitsBoardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import BreakpointOverlay from './BreakpointOverlay';

const UnitsBoard: React.FC<IUnitsBoardProps> = ({
    arena
}) => {
    const { isPortrait } = useScreenOrientation();
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

    // Portrait mode grid configuration -- far less here as we are dealing with
    // one set of breakpoints (we don't have landscape ones.. yet)
    const portraitGridTemplateColumns = {
        xs: 'repeat(2, minmax(3.5rem, 5.5rem))',
        //sm: 'repeat(3, minmax(0.5rem, 5rem))',
        // iphoneSE: 'repeat(3, minmax(0.5rem, 5rem))',
        //iphone12: 'repeat(3, minmax(3.5rem, 5rem))',
        md: 'repeat(3, minmax(3.5rem, 5.5em))',
        // iphone14max: 'repeat(3, minmax(1rem, 5rem))',
        // ipadMini: 'repeat(3, minmax(3.5rem, 5.5rem))',
        // ipadAir: 'repeat(3, minmax(3.5rem, 6rem))',
        lg: 'repeat(3, minmax(3.5rem, 6rem))',
        // ipadPro: 'repeat(3, minmax(3.5rem, 7rem))',
        //xl: 'repeat(5, minmax(3.5rem, 7rem))',
        //xxl: 'repeat(6, minmax(3.5rem, 7rem))',
        //xxxl: 'repeat(10, minmax(3.5rem, 7rem))'
    };
    
    // Landscape mode grid configuration
    const landscapeGridTemplateColumns = {
        xs: 'repeat(4, minmax(3.0rem, 5.5rem))',
        // sm: 'repeat(3, minmax(0.5rem, 5rem))',
        // iphoneSE: 'repeat(3, minmax(0.5rem, 5rem))',
        // iphone12: 'repeat(3, minmax(3.5rem, 5rem))',
        //md: 'repeat(3, minmax(3.5rem, 5.5em))',
        // iphone14max: 'repeat(3, minmax(1rem, 5rem))',
        ipadMini: 'repeat(4, minmax(3.5rem, 5.5rem))',
        //ipadAir: 'repeat(3, minmax(3.5rem, 6rem))',
        lg: 'repeat(4, minmax(3.5rem, 6rem))',
        ipadPro: 'repeat(4, minmax(3.5rem, 7rem))',
        xl: 'repeat(5, minmax(3.5rem, 7rem))',
        xxl: 'repeat(6, minmax(3.5rem, 7rem))',
        xxxl: 'repeat(10, minmax(3.5rem, 7rem))'
    };
    
    // Use appropriate grid template based on orientation
    const responsiveGridTemplateColumns = isPortrait ? portraitGridTemplateColumns : landscapeGridTemplateColumns;

    const styles = {
        mainBoxStyle: {
            position: 'relative',
            height: '100%',
            width: '100%',
            padding: '3rem 0.5rem',
            overflow: 'hidden',
        },
        containerStyle: {
            ...debugBorder('green'),
            height: '100%',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'column',
        },
        opponentGridStyle: {
            ...debugBorder('red'),
            display: 'grid',
            gap: 'clamp(2px, .5vw, 10px)',
            direction: arena === 'groundArena' ? 'ltr' : 'rtl',
            gridTemplateColumns: responsiveGridTemplateColumns,
            alignContent: 'start',
            justifyContent: 'start',
        },
        playerGridStyle: {
            ...debugBorder('blue'),
            display: 'grid',
            gap: 'clamp(5px, .5vw, 10px)',
            direction: arena === 'groundArena' ? 'ltr' : 'rtl',
            gridTemplateColumns: responsiveGridTemplateColumns,
            alignContent: 'end',
            justifyContent: 'start',
            
        },
    };


    return (
        <Box sx={styles.mainBoxStyle}>
            <Grid direction="column" sx={styles.containerStyle}>
                {/* Opponent's Ground Units */}
                <Box sx={styles.opponentGridStyle}>
                    {opponentUnits.map((card: ICardData) => (
                        <Box key={card.uuid}>
                            <GameCard key={card.uuid} card={card} subcards={card.subcards} capturedCards={card.capturedCards} cardStyle={CardStyle.InPlay}/>
                        </Box>
                    ))}
                </Box>
                {/* Enforce some minimum spacing between the two player's grids */}
                <Box sx={{ flex: '1 1 10px', minHeight: '10px', width: '100%' }} />
                {/* Player's Ground Units */}
                <Box sx={styles.playerGridStyle}>
                    {playerUnits.map((card: ICardData) => (
                        <Box key={card.uuid} >
                            <GameCard key={card.uuid} card={card} subcards={card.subcards} capturedCards={card.capturedCards} cardStyle={CardStyle.InPlay}/>
                        </Box>
                    ))}
                </Box>
            </Grid>
            {/* Show BreakpointOverlay when enabled in environment variables */}
            {isBreakpointOverlayEnabled() && <BreakpointOverlay />}
        </Box>
    );
};

export default UnitsBoard;