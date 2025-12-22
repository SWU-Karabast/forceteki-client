import {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import React from 'react';
import Timer from '@/app/_components/_sharedcomponents/Timer/Timer';
import { MAX_MAIN_TIME, MAX_TURN_TIME } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { Stack, Typography } from '@mui/material';
import { formatMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';

type PlayerState = {
    isActionPhaseActivePlayer?: boolean
    mainTimeRemaining: number,
    turnTimeRemaining: number,
} | undefined;

interface GameTimerProps extends CircularProgressProps {
    player: PlayerState;
    opponent: PlayerState;
}

const GameTimer: React.FC<GameTimerProps> = ({ player, opponent, ...props }) => {
    const activePlayer = player?.isActionPhaseActivePlayer;

    const initialTurnTime = activePlayer ? player?.turnTimeRemaining : opponent?.turnTimeRemaining; 
    const [turnTimeRemaining, setTurnTimeRemaining] = React.useState(
        initialTurnTime || MAX_TURN_TIME
    );
    const isTurnTime = turnTimeRemaining > 0;

    const initialMainTime = activePlayer ? player?.mainTimeRemaining : opponent?.mainTimeRemaining;
    const [mainTimeRemaining, setMainTimeRemaining] = React.useState(
        initialMainTime || MAX_MAIN_TIME
    );

    return (
        <Timer 
            hasLowOpacity={!activePlayer}
            maxTime={isTurnTime ? MAX_TURN_TIME : MAX_MAIN_TIME} 
            setTimeRemaining={isTurnTime ? setTurnTimeRemaining : setMainTimeRemaining}
            timeRemaining={isTurnTime ? turnTimeRemaining : mainTimeRemaining}
            tooltipLabel={`${activePlayer ? 'Your' : 'Opponent'} ${isTurnTime ? 'turn' : 'main'} time remaining` }
            {...props}
        >

            {!isTurnTime && <MainTimerLabel activePlayer={activePlayer}
                playerTimeRemaining={activePlayer ? mainTimeRemaining : player?.mainTimeRemaining} 
                opponentTimeRemaining={activePlayer ? opponent?.mainTimeRemaining : mainTimeRemaining} 
            />
            }
        </Timer>
    );
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
                sx={{ color: 'white', marginBottom: '2px', opacity: activePlayer ? 1 : 0.3 }}
            >{`${formatMilliseconds(playerTimeRemaining)}`}</Typography> 

            <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3 }} />
            
            <Typography
                variant="body1"
                sx={{ color: 'white', marginBottom: 0, opacity: !activePlayer ? 1 : 0.3 }}
                gutterBottom={false}

            >{`${formatMilliseconds(opponentTimeRemaining)}`}</Typography> 
        </Stack>
    )
}

export default GameTimer;