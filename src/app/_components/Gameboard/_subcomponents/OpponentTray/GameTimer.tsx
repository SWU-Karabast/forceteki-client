import {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import React from 'react';
import Timer from '@/app/_components/_sharedcomponents/Timer/Timer';
import { MAX_MAIN_TIME, MAX_TURN_TIME, secondsToMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { Stack, Typography } from '@mui/material';
import { formatMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';

type PlayerState = {
    isActionPhaseActivePlayer?: boolean
    mainTimeRemainingSeconds: number,
    turnTimeRemainingSeconds: number,
} | undefined;

interface GameTimerProps extends CircularProgressProps {
    player: PlayerState;
    opponent: PlayerState;
}

const GameTimer: React.FC<GameTimerProps> = ({ player, opponent, ...props }) => {
    const activePlayer = player?.isActionPhaseActivePlayer;

    const opponentTurnTimeRemainingMs = secondsToMilliseconds(opponent?.turnTimeRemainingSeconds || 0);
    const playerTurnTimeRemainingMs = secondsToMilliseconds(player?.turnTimeRemainingSeconds || 0);
    const initialTurnTime = activePlayer ? playerTurnTimeRemainingMs : opponentTurnTimeRemainingMs; 

    const [turnTimeRemainingMs, setTurnTimeRemainingMs] = React.useState(
        initialTurnTime || MAX_TURN_TIME
    );
    const isTurnTime = turnTimeRemainingMs > 0;

    const opponentMainTimeRemainingMs = secondsToMilliseconds(opponent?.mainTimeRemainingSeconds || 0);
    const playerMainTimeRemainingMs = secondsToMilliseconds(player?.mainTimeRemainingSeconds || 0);
    const initialMainTime = activePlayer ? playerMainTimeRemainingMs : opponentMainTimeRemainingMs;

    const [mainTimeRemainingMs, setMainTimeRemainingMs] = React.useState(
        initialMainTime || MAX_MAIN_TIME
    );

    return (
        <Timer 
            hasLowOpacity={!activePlayer}
            maxTime={isTurnTime ? MAX_TURN_TIME : MAX_MAIN_TIME} 
            setTimeRemaining={isTurnTime ? setTurnTimeRemainingMs : setMainTimeRemainingMs}
            timeRemaining={isTurnTime ? turnTimeRemainingMs : mainTimeRemainingMs}
            tooltipTitle={<TooltipContent 
                turnTimeRemainingSeconds={turnTimeRemainingMs} 
                activePlayer={activePlayer} 
            />}
            {...props}
        >

            <MainTimerLabel activePlayer={activePlayer}
                playerTimeRemaining={activePlayer ? mainTimeRemainingMs : playerMainTimeRemainingMs} 
                opponentTimeRemaining={activePlayer ? opponentMainTimeRemainingMs : mainTimeRemainingMs} 
            />
        </Timer>
    );
}

const TooltipContent = (
    { turnTimeRemainingSeconds, activePlayer }: 
    { turnTimeRemainingSeconds: number, activePlayer?: boolean }
) => {
    const playerLabel = activePlayer ? 'Your' : 'Opponent\'s';

    return (
        <Stack spacing={1}>     
            <Stack> 
                <Typography variant="body2" fontWeight={600}>
                    Game Timer
                </Typography>
                <Typography variant="body2">
                    Once turn time reaches zero, main time will be used.
                </Typography>
            </Stack> 

            <Stack width='fit-content'>
                <Typography variant="body2">
                    Your Main Time
                </Typography>
                <Divider />
                <Typography variant="body2">
                    Opp. Main Time
                </Typography>
            </Stack>

            <Typography variant="body2">
                {playerLabel} turn time remaining: {formatMilliseconds(turnTimeRemainingSeconds)}
            </Typography>


        </Stack>
    )
}

const MainTimerLabel = ({ 
    activePlayer, 
    playerTimeRemaining = MAX_MAIN_TIME, 
    opponentTimeRemaining = MAX_MAIN_TIME 
}: { 
    activePlayer?: boolean, 
    playerTimeRemaining?: number, 
    opponentTimeRemaining?: number 
}) => {
    return (
        <Stack spacing={0}>
            <Typography
                variant="body1"
                sx={{ color: 'white', marginBottom: 0, opacity: activePlayer ? 1 : 0.3, cursor: 'pointer' }}
            >{`${formatMilliseconds(playerTimeRemaining)}`}</Typography> 

            <Divider />
            
            <Typography
                variant="body1"
                sx={{ color: 'white', marginBottom: 0, opacity: !activePlayer ? 1 : 0.3, cursor: 'pointer' }}
            >{`${formatMilliseconds(opponentTimeRemaining)}`}</Typography> 

        </Stack>
    )
}

const Divider = () => <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3, marginTop: '2px' }} />


export default GameTimer;