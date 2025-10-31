import React from 'react';
import { Box, Button } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { ICardData } from './CardTypes';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';

interface ICardValueAdjusterProps {
    card: ICardData;
    isIndirect?: boolean;
}

const CardValueAdjuster: React.FC<ICardValueAdjusterProps> = ({ card, isIndirect = false }) => {
    const { updateDistributionPrompt, distributionPromptData, gameState, connectedPlayer } = useGame();

    const handleValueAdjusterClick = (amount: number) => {
        updateDistributionPrompt(card.uuid, amount);
    };


    const counter = distributionPromptData?.valueDistribution.find((entry: DistributionEntry) => entry.uuid === card.uuid)?.amount ?? 0;
    const atZero = counter === 0;
    const maxAssignableForCard = (card.hp ?? 0) - (card.damage ?? 0);
    // Only prevent over-assignment for indirect damage; for other types, allow over-assignment
    const atMaxAssignable = isIndirect && distributionPromptData && counter === maxAssignableForCard;

    // Calculate total amount already distributed across all targets
    const totalDistributed = distributionPromptData?.valueDistribution.reduce((sum: number, entry: DistributionEntry) => sum + entry.amount, 0) ?? 0;
    // Get the total amount available to distribute from the prompt state
    const totalAvailable = gameState.players[connectedPlayer]?.promptState?.distributeAmongTargets?.amount ?? 0;
    // Disable +1 if all available damage/healing has been distributed
    const allDamageDistributed = totalDistributed >= totalAvailable && totalAvailable > 0;

    const type = gameState.players[connectedPlayer]?.promptState.distributeAmongTargets.type;
    const distributeDamage = type === 'distributeDamage' || type === 'distributeIndirectDamage';
    const distributeHealing = type === 'distributeHealing';

    const styles = {
        valueAdjuster: {
            display: 'flex',
            flexDirection: 'row', // ensures left-to-right layout
            direction: 'ltr', // <== override inherited RTL direction
            position: 'absolute',
            top: '100%',
            width: '100%',
            border: '1px solid #404040',
            borderRadius: '4px',
            zIndex: 1
        },
        valueAdjusterButton: {
            background: distributeDamage ? 'rgba(219, 19, 29, 0.8)' : distributeHealing && 'rgba(0, 186, 255, 0.8)',
            '&:hover:not(.Mui-disabled)': {
                background: distributeDamage ? 'rgba(219, 19, 29, 1)' : distributeHealing && 'rgba(0, 186, 255, 1)',
            },
            '&.Mui-disabled' : {
                background: distributeDamage ? 'rgba(219, 19, 29, 0.3)' : distributeHealing && 'rgba(0, 186, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.5)',
            },
            flex: 1,
            minWidth: '50%',
            padding: '.2rem', // overrides the variant "contained"'s padding that was breaking layout
            ':first-of-type': {
                borderRadius: '4px 0px 0px 4px',
                borderRight: '1px solid #404040',
            },
            ':last-of-type': {
                borderRadius: '0px 4px 4px 0px'
            }
        },
    }
    return (
        <Box sx={styles.valueAdjuster} data-value-adjuster="true">
            <Button
                sx={styles.valueAdjusterButton}
                variant="contained"
                color="primary"
                disabled={!!atZero}
                onClick={() => handleValueAdjusterClick(-1)}
            >
                -1
            </Button>
            <Button
                sx={styles.valueAdjusterButton}
                variant="contained"
                color="primary"
                disabled={!!atMaxAssignable || allDamageDistributed}
                onClick={() => handleValueAdjusterClick(+1)}
            >
                +1
            </Button>
        </Box>
    );
}

export default CardValueAdjuster;