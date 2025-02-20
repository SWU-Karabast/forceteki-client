import React from 'react';
import { Box, Button } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';

interface ICardValueAdjusterProps {
    cardId: string;
}

const CardValueAdjuster: React.FC<ICardValueAdjusterProps> = ({ cardId }) => {
    const { updateDistributionPrompt } = useGame();

    const handleValueAdjusterClick = (amount: number) => {
        updateDistributionPrompt(cardId, amount);
    };

    const styles = {
        valueAdjuster: {
            display: 'flex',
            position: 'absolute',
            top: '100%',
            width: '100%',
            border: '1px solid #404040',
            borderRadius: '4px',
            zIndex: 1
        },
        valueAdjusterButton: {
            flex: 1,
            minWidth: '50%',
            ':first-of-type': {
                borderRadius: '4px 0px 0px 4px',
                borderRight: '1px solid #404040',
            },
            ':last-of-types': {
                borderRadius: '0px 4px 4px 0px'
            }
        },
    }
    return (
        <Box sx={styles.valueAdjuster}>
            <Button sx={styles.valueAdjusterButton} variant="contained" color="primary" onClick={() => handleValueAdjusterClick(-1)} >-1</Button>
            <Button sx={styles.valueAdjusterButton} variant="contained" color="primary" onClick={() => handleValueAdjusterClick(+1)}>+1</Button>
        </Box>
    );
}

export default CardValueAdjuster;