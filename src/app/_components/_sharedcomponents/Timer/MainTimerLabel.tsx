import React from 'react';
import { Stack, Typography } from '@mui/material';
import { formatMilliseconds, MAX_MAIN_TIME } from './timerUtils';

const labelDefaultStyles = {
    marginBottom: 0,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: { xs: '1.5rem', md: '1rem' }
};

const Divider = () => <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3, marginTop: '2px' }} />;

interface MainTimerLabelProps {
    playerIsActive?: boolean;
    opponentIsActive?: boolean;
    playerIsTurnTime?: boolean;
    opponentIsTurnTime?: boolean;
    playerTimeRemaining?: number;
    opponentTimeRemaining?: number;
}

const MainTimerLabel: React.FC<MainTimerLabelProps> = ({
    playerIsActive,
    opponentIsActive,
    playerIsTurnTime,
    opponentIsTurnTime,
    playerTimeRemaining = MAX_MAIN_TIME,
    opponentTimeRemaining = MAX_MAIN_TIME,
}) => (
    <Stack spacing={0}>
        <Typography
            variant="body1"
            sx={{
                ...labelDefaultStyles,
                color: 'var(--initiative-red)',
                opacity: opponentIsActive && !opponentIsTurnTime ? 1 : 0.65,
            }}
        >{formatMilliseconds(opponentTimeRemaining)}</Typography>
        <Divider />
        <Typography
            variant="body1"
            sx={{
                ...labelDefaultStyles,
                color: 'var(--initiative-blue)',
                opacity: playerIsActive && !playerIsTurnTime ? 1 : 0.65,
            }}
        >{formatMilliseconds(playerTimeRemaining)}</Typography>
    </Stack>
);

export default MainTimerLabel;
