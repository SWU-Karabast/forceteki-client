import React, { useEffect } from 'react';
import Timer from '@/app/_components/_sharedcomponents/Timer/Timer';
import { MAX_MAIN_TIME, MAX_TURN_TIME, secondsToMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { Stack, Typography } from '@mui/material';
import { formatMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { useGame } from '@/app/_contexts/Game.context';

const TIMER_STEP = 100;

const GameTimer: React.FC = ({ ...props }) => {
    const { gameState, connectedPlayer, getOpponent } = useGame();
    const playerState = gameState?.players[connectedPlayer];
    const opponentState = gameState?.players[getOpponent(connectedPlayer)];

    const playerIsActive = playerState?.timerIsRunning ?? false;
    const opponentIsActive = opponentState?.timerIsRunning ?? false;

    // Per-player turn time state derived from server values
    const playerIsTurnTime = (playerState?.turnTimeRemainingSeconds ?? 0) > 0;
    const opponentIsTurnTime = (opponentState?.turnTimeRemainingSeconds ?? 0) > 0;

    // Circular timer countdown state (tracks connected player's timer, falls back to opponent)
    const [turnTimeRemainingMs, setTurnTimeRemainingMs] = React.useState(MAX_TURN_TIME);
    const isTurnTime = turnTimeRemainingMs > 0;
    const [playerMainTimeRemainingMs, setPlayerMainTimeRemainingMs] = React.useState(MAX_MAIN_TIME);

    // Opponent main time countdown state (independent of the circular <Timer> widget)
    const [opponentMainTimeRemainingMs, setOpponentMainTimeRemainingMs] = React.useState(MAX_MAIN_TIME);

    // Sync both timers from server state
    useEffect(() => {
        const opponentTurnTimeRemainingMs = secondsToMilliseconds(opponentState?.turnTimeRemainingSeconds || 0);
        const playerTurnTimeRemainingMs = secondsToMilliseconds(playerState?.turnTimeRemainingSeconds || 0);

        // Prefer the connected player's turn timer; fall back to opponent's if only they are active
        setTurnTimeRemainingMs(playerIsActive ? playerTurnTimeRemainingMs : opponentTurnTimeRemainingMs);
        setPlayerMainTimeRemainingMs(secondsToMilliseconds(playerState?.mainTimeRemainingSeconds || 0));
        setOpponentMainTimeRemainingMs(secondsToMilliseconds(opponentState?.mainTimeRemainingSeconds || 0));
    }, [playerIsActive, opponentState?.turnTimeRemainingSeconds, opponentState?.mainTimeRemainingSeconds, playerState?.turnTimeRemainingSeconds, playerState?.mainTimeRemainingSeconds])

    // Client-side countdown for opponent main time (independent of the <Timer> component's interval)
    useEffect(() => {
        const interval = setInterval(() => {
            if (opponentIsActive && !opponentIsTurnTime) {
                setOpponentMainTimeRemainingMs((prev) => prev > 0 ? prev - TIMER_STEP : 0);
            }
        }, TIMER_STEP);
        return () => clearInterval(interval);
    }, [opponentIsActive, opponentIsTurnTime]);

    // Color changes and background only react to the connected player's timer state
    const hasLowOpacity = !playerIsActive;
    const shouldAdjustBackgroundColor = playerIsActive && !isTurnTime;

    return (
        <Timer
            hasLowOpacity={hasLowOpacity}
            isRunning={isTurnTime ? (playerIsActive || opponentIsActive) : playerIsActive}
            maxTime={isTurnTime ? MAX_TURN_TIME : MAX_MAIN_TIME}
            setTimeRemaining={isTurnTime ? setTurnTimeRemainingMs : setPlayerMainTimeRemainingMs}
            timeRemaining={isTurnTime ? turnTimeRemainingMs : playerMainTimeRemainingMs}
            shouldAdjustBackgroundColor={shouldAdjustBackgroundColor}
            tooltipTitle={<TooltipContent
                turnTimeRemainingSeconds={turnTimeRemainingMs}
                playerIsActive={playerIsActive}
            />}
            {...props}
        >
            <MainTimerLabel
                playerIsActive={playerIsActive}
                opponentIsActive={opponentIsActive}
                playerIsTurnTime={playerIsTurnTime}
                opponentIsTurnTime={opponentIsTurnTime}
                playerTimeRemaining={playerMainTimeRemainingMs}
                opponentTimeRemaining={opponentMainTimeRemainingMs}
            />
        </Timer>
    );
}

const TooltipContent = (
    { turnTimeRemainingSeconds, playerIsActive }:
    { turnTimeRemainingSeconds: number, playerIsActive?: boolean }
) => {
    const playerLabel = playerIsActive ? 'Your' : 'Opponent\'s';

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
    playerIsActive,
    opponentIsActive,
    playerIsTurnTime,
    opponentIsTurnTime,
    playerTimeRemaining = MAX_MAIN_TIME,
    opponentTimeRemaining = MAX_MAIN_TIME,
}: {
    playerIsActive?: boolean,
    opponentIsActive?: boolean,
    playerIsTurnTime?: boolean,
    opponentIsTurnTime?: boolean,
    playerTimeRemaining?: number,
    opponentTimeRemaining?: number,
}) => {
    return (
        <Stack spacing={0}>
            <Typography
                variant="body1"
                sx={{
                    color: 'var(--initiative-red)',
                    marginBottom: 0,
                    cursor: 'pointer',
                    opacity: opponentIsActive && !opponentIsTurnTime ? 1 : 0.5,
                }}
            >{`${formatMilliseconds(opponentTimeRemaining)}`}</Typography>
            <Divider />
            <Typography
                variant="body1"
                sx={{
                    color: 'var(--initiative-blue)',
                    marginBottom: 0,
                    cursor: 'pointer',
                    opacity: playerIsActive && !playerIsTurnTime ? 1 : 0.5,
                }}
            >{`${formatMilliseconds(playerTimeRemaining)}`}</Typography>
        </Stack>
    )
}

const Divider = () => <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3, marginTop: '2px' }} />


export default GameTimer;
