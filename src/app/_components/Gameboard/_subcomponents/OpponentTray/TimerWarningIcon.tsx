import React from 'react';
import { AccessAlarm } from '@mui/icons-material';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { useGame } from '@/app/_contexts/Game.context';
import { PlayerTimeRemainingStatus } from '@/app/_contexts/UserTypes';

const pulseYellow = keyframes`
    0% {
        background: transparent;
    }
    50% {
        background: rgba(220, 185, 0, 0.3);
        box-shadow: 0 0 16px rgba(220, 185, 0, 0.7);
    }
    100% {
        background: transparent;
    }
`;

const pulseRed = keyframes`
    0% {
        background: transparent;
    }
    50% {
        background: rgba(255, 0, 0, 0.3);
        box-shadow: 0 0 16px rgba(255, 0, 0, 0.7);
    }
    100% {
        background: transparent;
    }
`;

/**
 * Pulsing alarm icon shown when the player's main timer is low. Used as the
 * replacement signal when the timer UI is fully hidden — without it, players
 * with HideAll preference get no warning before timing out.
 */
const TimerWarningIcon: React.FC = () => {
    const { gameState, connectedPlayer } = useGame();
    const status = gameState?.players[connectedPlayer]?.timeRemainingStatus;

    if (status !== PlayerTimeRemainingStatus.Warning && status !== PlayerTimeRemainingStatus.Danger) {
        return null;
    }

    const isDanger = status === PlayerTimeRemainingStatus.Danger;

    return (
        <Box
            sx={{
                borderRadius: '50%',
                animation: `${isDanger ? pulseRed : pulseYellow} 3s infinite ease-in-out`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <AccessAlarm
                sx={{
                    fontSize: '4rem',
                    color: isDanger ? 'rgba(255, 0, 0, 1)' : 'rgba(220, 185, 0, 1)',
                }}
            />
        </Box>
    );
};

export default TimerWarningIcon;
