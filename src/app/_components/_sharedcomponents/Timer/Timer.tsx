import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import React, { useMemo } from 'react';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatMilliseconds, getTimerColor } from './timerUtils';

const TIMER_STEP = 100; // shorter intervals provide a smoother progress animation
interface TimerProps extends CircularProgressProps {
    activeTurn?: 'player' | 'opponent';
    children?: React.ReactNode;
    isRunning?: boolean;
    isTurnTime?: boolean;
    maxTime: number;
    setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
    timeRemaining: number;
    tooltipTitle?: TooltipProps['title'];
}

const Timer: React.FC<TimerProps> = ({
    activeTurn,
    children,
    isRunning = true,
    isTurnTime = false,
    maxTime,
    setTimeRemaining,
    timeRemaining,
    tooltipTitle,
    ...props }) => {
    // Decreases turn time every 100ms, to provide a smooth countdown animation
    React.useEffect(() => {
        const timer = setInterval(() => {
            if (isRunning) {
                setTimeRemaining((prevTimeRemaining) => prevTimeRemaining > 0 ? prevTimeRemaining - TIMER_STEP : 0);
            }
        }, TIMER_STEP);

        return () => {
            clearInterval(timer);
        };
    }, [isRunning, maxTime, setTimeRemaining]);

    const { timerColor, timerOpacity, timerWarning } = useMemo(() => getTimerColor({
        timeRemaining,
        maxTime,
        activeTurn,
    }), [
        timeRemaining, maxTime, activeTurn,
    ])

    return (
        <Tooltip
            arrow={true}
            title={
                Boolean(tooltipTitle) 
                    ? tooltipTitle 
                    : (
                        <Typography variant="body2">
                            Time Remaining: {formatMilliseconds(timeRemaining)}
                        </Typography>
                    )
            }
        >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    variant='determinate'
                    size={80}
                    value={(timeRemaining / (maxTime / 100))} // Must be value between 0-100
                    sx={{
                        color: timerColor,
                        opacity: timerOpacity,
                    }}
                    {...props}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: timerWarning && !isTurnTime
                            ? 'radial-gradient(circle,rgba(0, 0, 0, 0.1) 24%, rgba(207, 0, 0, 1) 100%)'
                            : 'transparent',
                        borderRadius: '50%',
                        outline: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                >
                    {children || (
                        <Typography
                            variant="body1"
                            sx={{ color: timerColor }}
                        >
                            {formatMilliseconds(timeRemaining)}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Tooltip>
    );
}

export default Timer;