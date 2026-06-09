import React from 'react';
import { Typography } from '@mui/material';
import Timer from './Timer';
import MainTimerLabel from './MainTimerLabel';
import { MAX_MAIN_TIME, MAX_TURN_TIME } from './timerUtils';
import { TimerVisibility } from '@/app/_contexts/UserTypes';

const MOCK_TURN_TIME_REMAINING = 12_000;
const MOCK_PLAYER_MAIN_TIME = 100_000;
const MOCK_OPPONENT_MAIN_TIME = 110_000;

const noOp = () => undefined;

/**
 * Static preview of the game timer for use in the preferences UI. Renders the real
 * Timer + label components with fixed mock values and isRunning=false so nothing
 * animates or counts down.
 */
const TimerPreview: React.FC<{ visibility: TimerVisibility }> = ({ visibility }) => {
    if (visibility === TimerVisibility.HideAll) {
        return (
            <Timer
                hideProgressIndicator
                isRunning={false}
                maxTime={MAX_MAIN_TIME}
                timeRemaining={MAX_MAIN_TIME}
                setTimeRemaining={noOp}
                tooltipTitle="Timer hidden"
            >
                <Typography
                    variant="body2"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.35)',
                        fontSize: '0.7rem',
                        textAlign: 'center',
                        lineHeight: 1.3,
                    }}
                >
                    Timer<br />hidden
                </Typography>
            </Timer>
        );
    }

    return (
        <Timer
            activeTurn="player"
            hideProgressIndicator={visibility === TimerVisibility.HideTurnTimer}
            isTurnTime
            isRunning={false}
            maxTime={MAX_TURN_TIME}
            timeRemaining={MOCK_TURN_TIME_REMAINING}
            setTimeRemaining={noOp}
            tooltipTitle="Preview"
        >
            <MainTimerLabel
                playerIsActive
                opponentIsActive={false}
                playerIsTurnTime
                opponentIsTurnTime={false}
                playerTimeRemaining={MOCK_PLAYER_MAIN_TIME}
                opponentTimeRemaining={MOCK_OPPONENT_MAIN_TIME}
            />
        </Timer>
    );
};

export default TimerPreview;
