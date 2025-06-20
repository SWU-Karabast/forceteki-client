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

    const atMaxAssignable = isIndirect && distributionPromptData && distributionPromptData.valueDistribution.find((entry: DistributionEntry) => entry.uuid === card.uuid)?.amount === ((card.hp ?? 0) - (card.damage ?? 0));

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
            '&:hover': {
                background: distributeDamage ? 'rgba(219, 19, 29, 1)' : distributeHealing && 'rgba(0, 186, 255, 1)',
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
        <Box sx={styles.valueAdjuster}>
            <Button sx={styles.valueAdjusterButton} variant="contained" color="primary" onClick={() => handleValueAdjusterClick(-1)} >-1</Button>
            <Button sx={styles.valueAdjusterButton} variant="contained" color="primary" disabled={!!atMaxAssignable} onClick={() => handleValueAdjusterClick(+1)}>+1</Button>
        </Box>
    );
}

export default CardValueAdjuster;