import React, { useEffect } from 'react';
import Timer from '@/app/_components/_sharedcomponents/Timer/Timer';
import { MAX_MAIN_TIME, MAX_TURN_TIME, secondsToMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { Stack, Typography } from '@mui/material';
import { formatMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { useGame } from '@/app/_contexts/Game.context';

const GameTimer: React.FC = ({ ...props }) => {
    const { gameState, connectedPlayer, getOpponent } = useGame();
    const playerState = gameState?.players[connectedPlayer];
    const opponentState = gameState?.players[getOpponent(connectedPlayer)];
    const playerIsActivePlayer = playerState?.isActionPhaseActivePlayer || !playerState.promptState.menuTitle.toLowerCase().includes('waiting');

    const [turnTimeRemainingMs, setTurnTimeRemainingMs] = React.useState(MAX_TURN_TIME);
    const isTurnTime = turnTimeRemainingMs > 0;

    const opponentMainTimeRemainingMs = secondsToMilliseconds(opponentState?.mainTimeRemainingSeconds || 0);
    const playerMainTimeRemainingMs = secondsToMilliseconds(playerState?.mainTimeRemainingSeconds || 0);
    const [mainTimeRemainingMs, setMainTimeRemainingMs] = React.useState(MAX_MAIN_TIME);

    useEffect(() => {
        /* Syncs timers with the server when a game state update is received
         *
         * Examples of game state updates that should sync timers: 
         * - on initial page load / page refresh
         * - when an action is taken, we reset the turn timer
         * - when the turn timer is out, we start using the main timer
        * */
        const opponentTurnTimeRemainingMs = secondsToMilliseconds(opponentState?.turnTimeRemainingSeconds || 0);
        const playerTurnTimeRemainingMs = secondsToMilliseconds(playerState?.turnTimeRemainingSeconds || 0);

        const newTurnTimeRemaining = playerIsActivePlayer ? playerTurnTimeRemainingMs : opponentTurnTimeRemainingMs;

        setTurnTimeRemainingMs(newTurnTimeRemaining);
        
        setMainTimeRemainingMs(
            playerIsActivePlayer ? playerMainTimeRemainingMs : opponentMainTimeRemainingMs
        );
    }, [playerIsActivePlayer, opponentState?.turnTimeRemainingSeconds, opponentMainTimeRemainingMs, playerState?.turnTimeRemainingSeconds, playerMainTimeRemainingMs])

    return (
        <Timer 
            hasLowOpacity={!playerIsActivePlayer}
            maxTime={isTurnTime ? MAX_TURN_TIME : MAX_MAIN_TIME} 
            setTimeRemaining={isTurnTime ? setTurnTimeRemainingMs : setMainTimeRemainingMs}
            timeRemaining={isTurnTime ? turnTimeRemainingMs : mainTimeRemainingMs}
            shouldAdjustBackgroundColor={playerIsActivePlayer && !isTurnTime}
            tooltipTitle={<TooltipContent 
                turnTimeRemainingSeconds={turnTimeRemainingMs} 
                activePlayer={playerIsActivePlayer} 
            />}
            {...props}
        >

            <MainTimerLabel activePlayer={playerIsActivePlayer} isTurnTime={isTurnTime} 
                playerTimeRemaining={playerIsActivePlayer ? mainTimeRemainingMs : playerMainTimeRemainingMs} 
                opponentTimeRemaining={playerIsActivePlayer ? opponentMainTimeRemainingMs : mainTimeRemainingMs} 
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
    opponentTimeRemaining = MAX_MAIN_TIME,
    isTurnTime = true, 
}: { 
    activePlayer?: boolean, 
    playerTimeRemaining?: number, 
    opponentTimeRemaining?: number,
    isTurnTime?: boolean
}) => {
    return (
        <Stack spacing={0}>
            <Typography
                variant="body1"
                sx={{ 
                    color: 'var(--initiative-red)',
                    marginBottom: 0, 
                    cursor: 'pointer',
                    opacity: !activePlayer && !isTurnTime ? 1 : 0.5, 

                }}
            >{`${formatMilliseconds(opponentTimeRemaining)}`}</Typography> 
            <Divider />
            <Typography
                variant="body1"
                sx={{ 
                    color: 'var(--initiative-blue)',
                    marginBottom: 0, 
                    cursor: 'pointer',
                    opacity: activePlayer && !isTurnTime ? 1 : 0.5, 
                }}
            >{`${formatMilliseconds(playerTimeRemaining)}`}</Typography> 

            

        </Stack>
    )
}

const Divider = () => <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3, marginTop: '2px' }} />


export default GameTimer;