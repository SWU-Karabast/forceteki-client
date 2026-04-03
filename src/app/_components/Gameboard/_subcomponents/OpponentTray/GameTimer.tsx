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
    const [opponentMainTimeRemainingMs, setOpponentMainTimeRemainingMs] = React.useState(MAX_MAIN_TIME);

    // Wall-clock expiry timestamps — updated on each server sync, used to correct drift on tab focus
    const playerMainTimeExpiryRef = React.useRef<number | null>(null);
    const opponentMainTimeExpiryRef = React.useRef<number | null>(null);

    // Refs so the visibility handler (empty deps) can read current turn time state without stale closures
    const playerIsTurnTimeRef = React.useRef(playerIsTurnTime);
    const opponentIsTurnTimeRef = React.useRef(opponentIsTurnTime);
    useEffect(() => {
        playerIsTurnTimeRef.current = playerIsTurnTime;
        opponentIsTurnTimeRef.current = opponentIsTurnTime;
    }, [playerIsTurnTime, opponentIsTurnTime]);

    // Sync both timers from server state
    useEffect(() => {
        const opponentTurnTimeRemainingMs = secondsToMilliseconds(opponentState?.turnTimeRemainingSeconds || 0);
        const playerTurnTimeRemainingMs = secondsToMilliseconds(playerState?.turnTimeRemainingSeconds || 0);
        const playerMs = secondsToMilliseconds(playerState?.mainTimeRemainingSeconds || 0);
        const opponentMs = secondsToMilliseconds(opponentState?.mainTimeRemainingSeconds || 0);

        // Prefer the connected player's turn timer; fall back to opponent's if only they are active
        setTurnTimeRemainingMs(playerIsActive ? playerTurnTimeRemainingMs : opponentTurnTimeRemainingMs);
        setPlayerMainTimeRemainingMs(playerMs);
        setOpponentMainTimeRemainingMs(opponentMs);

        // Only record expiry when actively consuming main time — null means skip correction on tab focus
        playerMainTimeExpiryRef.current = playerIsActive && !playerIsTurnTime ? Date.now() + playerMs : null;
        opponentMainTimeExpiryRef.current = opponentIsActive && !opponentIsTurnTime ? Date.now() + opponentMs : null;
    }, [playerIsActive, opponentIsActive, playerIsTurnTime, opponentIsTurnTime, opponentState?.turnTimeRemainingSeconds, opponentState?.mainTimeRemainingSeconds, playerState?.turnTimeRemainingSeconds, playerState?.mainTimeRemainingSeconds])

    // Correct main time drift caused by browser throttling setInterval in background tabs
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (playerMainTimeExpiryRef.current !== null && !playerIsTurnTimeRef.current) {
                    setPlayerMainTimeRemainingMs(Math.max(0, playerMainTimeExpiryRef.current - Date.now()));
                }
                if (opponentMainTimeExpiryRef.current !== null && !opponentIsTurnTimeRef.current) {
                    setOpponentMainTimeRemainingMs(Math.max(0, opponentMainTimeExpiryRef.current - Date.now()));
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [])

    // When opponent is on main time and player is inactive, the circle handles the countdown.
    // Only run the manual countdown when the player is also active (circle is showing player's time).
    useEffect(() => {
        const interval = setInterval(() => {
            if (opponentIsActive && !opponentIsTurnTime && playerIsActive) {
                setOpponentMainTimeRemainingMs((prev) => prev > 0 ? prev - TIMER_STEP : 0);
            }
        }, TIMER_STEP);
        return () => clearInterval(interval);
    }, [opponentIsActive, opponentIsTurnTime, playerIsActive]);

    const activeTurn = playerIsActive ? 'player' : opponentIsActive ? 'opponent' : undefined;
    // Show opponent's main time in the circle when they are active on main time and player is not active
    const showOpponentMainTime = !playerIsActive && opponentIsActive && !isTurnTime;

    return (
        <Timer
            activeTurn={activeTurn}
            isTurnTime={isTurnTime}
            isRunning={isTurnTime ? (playerIsActive || opponentIsActive) : (playerIsActive || showOpponentMainTime)}
            maxTime={isTurnTime ? MAX_TURN_TIME : MAX_MAIN_TIME}
            setTimeRemaining={isTurnTime ? setTurnTimeRemainingMs : showOpponentMainTime ? setOpponentMainTimeRemainingMs : setPlayerMainTimeRemainingMs}
            timeRemaining={isTurnTime ? turnTimeRemainingMs : showOpponentMainTime ? opponentMainTimeRemainingMs : playerMainTimeRemainingMs}
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
                    opacity: opponentIsActive && !opponentIsTurnTime ? 1 : 0.65,
                    fontWeight:600,
                }}
            >{`${formatMilliseconds(opponentTimeRemaining)}`}</Typography>
            <Divider />
            <Typography
                variant="body1"
                sx={{
                    color: 'var(--initiative-blue)',
                    marginBottom: 0,
                    cursor: 'pointer',
                    opacity: playerIsActive && !playerIsTurnTime ? 1 : 0.65,
                    fontWeight:600,
                }}
            >{`${formatMilliseconds(playerTimeRemaining)}`}</Typography>
        </Stack>
    )
}

const Divider = () => <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3, marginTop: '2px' }} />


export default GameTimer;
