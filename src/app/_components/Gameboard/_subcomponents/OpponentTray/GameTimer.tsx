import {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import React, { useEffect } from 'react';
import Timer from '@/app/_components/_sharedcomponents/Timer/Timer';
import { MAX_MAIN_TIME, MAX_TURN_TIME, secondsToMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { Stack, Typography } from '@mui/material';
import { formatMilliseconds } from '@/app/_components/_sharedcomponents/Timer/timerUtils';
import { usePageVisibility } from '@/app/_hooks/usePageVisibility';

type PlayerState = {
    isActionPhaseActivePlayer?: boolean
    mainTimeRemainingSeconds: number,
    turnTimeRemainingSeconds: number,
} | undefined;

interface GameTimerProps extends CircularProgressProps {
    player: PlayerState;
    opponent: PlayerState;
    phase: 'setup' | 'action' | 'regroup';
    messages: object[];
}

const GameTimer: React.FC<GameTimerProps> = ({ player, opponent, phase, messages, ...props }) => {
    const activePlayer = player?.isActionPhaseActivePlayer;

    const [turnTimeRemainingMs, setTurnTimeRemainingMs] = React.useState(MAX_TURN_TIME);
    const isTurnTime = turnTimeRemainingMs > 0;

    const opponentMainTimeRemainingMs = secondsToMilliseconds(opponent?.mainTimeRemainingSeconds || 0);
    const playerMainTimeRemainingMs = secondsToMilliseconds(player?.mainTimeRemainingSeconds || 0);
    const [mainTimeRemainingMs, setMainTimeRemainingMs] = React.useState(MAX_MAIN_TIME);

    useEffect(() => {
        /* Syncs timers with the server when a game state update is received
         *
         * Examples of game state updates that should sync timers: 
         * - on initial page load / page refresh
         * - when an action is taken, we reset the turn timer
         * - when the turn timer is out, we start using the main timer
        * */
        const isStartOfSetup = phase === 'setup' && messages.length === 0;
        const opponentTurnTimeRemainingMs = secondsToMilliseconds(opponent?.turnTimeRemainingSeconds || 0);
        const playerTurnTimeRemainingMs = secondsToMilliseconds(player?.turnTimeRemainingSeconds || 0);

        const newTurnTimeRemaining = activePlayer ? playerTurnTimeRemainingMs : opponentTurnTimeRemainingMs;
        setTurnTimeRemainingMs(isStartOfSetup ? MAX_TURN_TIME : newTurnTimeRemaining);
        
        setMainTimeRemainingMs(
            activePlayer ? playerMainTimeRemainingMs : opponentMainTimeRemainingMs
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        player?.turnTimeRemainingSeconds, 
        player?.mainTimeRemainingSeconds, 
        opponent?.turnTimeRemainingSeconds, 
        opponent?.mainTimeRemainingSeconds, 
        phase
    ])

    const isTabActive = usePageVisibility();
    const [timeLeftTab, setTimeLeftTab] = React.useState<Date | null>(null);

    // Handles syncing timers when the user switches tabs and comes back
    // Because timers are typically paused by the browser when a tab is inactive
    useEffect(() => {
        if (isTabActive) {
            // The player has returned! Calculate the elapsed time and adjust timers accordingly
            if(timeLeftTab) {
                const now = new Date();
                // Rounds down to nearest second
                const timeAway = Math.floor((now.getTime() - timeLeftTab.getTime()) / 1000) * 1000;
                
                if(isTurnTime) {
                    setTurnTimeRemainingMs(prev => prev - timeAway) 
                } else {
                    setMainTimeRemainingMs(prev => prev - timeAway);
                }
                setTimeLeftTab(null);
            }
        } else {
            setTimeLeftTab(new Date());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTabActive]); // Executes whenever the tab visibility changes


    return (
        <Timer 
            hasLowOpacity={!activePlayer}
            maxTime={isTurnTime ? MAX_TURN_TIME : MAX_MAIN_TIME} 
            setTimeRemaining={isTurnTime ? setTurnTimeRemainingMs : setMainTimeRemainingMs}
            timeRemaining={isTurnTime ? turnTimeRemainingMs : mainTimeRemainingMs}
            shouldAdjustBackgroundColor={activePlayer && !isTurnTime}
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
                sx={{ 
                    color: 'white',
                    marginBottom: 0, 
                    cursor: 'pointer',
                    opacity: activePlayer ? 1 : 0.3, 
                }}
            >{`${formatMilliseconds(playerTimeRemaining)}`}</Typography> 

            <Divider />
            
            <Typography
                variant="body1"
                sx={{ 
                    color: 'white',
                    marginBottom: 0, 
                    cursor: 'pointer',
                    opacity: !activePlayer ? 1 : 0.3, 

                }}
            >{`${formatMilliseconds(opponentTimeRemaining)}`}</Typography> 

        </Stack>
    )
}

const Divider = () => <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3, marginTop: '2px' }} />


export default GameTimer;