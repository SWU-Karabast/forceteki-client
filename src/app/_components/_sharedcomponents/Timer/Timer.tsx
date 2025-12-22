import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import React, { useMemo } from 'react';
import TimerIcon from './TimerIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';
import { formatMilliseconds } from './timerUtils';

const TIMER_STEP = 100; // shorter intervals provide a smoother progress animation

interface GameTimerProps extends CircularProgressProps {
    children?: React.ReactNode;
    hasLowOpacity?: boolean;
    isRunning?: boolean;
    maxTime: number;
    setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
    timeRemaining: number;
    tooltipLabel?: string;
}

const GameTimer: React.FC<GameTimerProps> = ({ 
    children, 
    hasLowOpacity,
    isRunning = true, 
    maxTime, 
    setTimeRemaining,
    timeRemaining, 
    tooltipLabel = 'Time Remaining', 
    ...props }) => {
    // Decrease turn time every interval
    React.useEffect(() => {
        const timer = setInterval(() => {
            isRunning ? setTimeRemaining((prevTimeRemaining) => prevTimeRemaining > 0 ? prevTimeRemaining - TIMER_STEP : maxTime) : null;
        }, TIMER_STEP);

        return () => {
            clearInterval(timer);
        };
    }, [isRunning, maxTime, setTimeRemaining]);

    const progressColor = timeRemaining > (maxTime / 3)
        ? 'inherit'
        : timeRemaining > (maxTime / 6)
            ? 'warning'
            : 'error';

    const value = useMemo(() => {
        if(timeRemaining > 0) {
            return (timeRemaining / (maxTime / 100));
        } else {
            return 100 // When time is 0, show full circle
        }
    }, [timeRemaining, maxTime]);

    return (
        <Tooltip
            arrow={true}
            title={<Stack>
                <Typography variant="body2">
                    {tooltipLabel}: {formatMilliseconds(timeRemaining)}
                </Typography>
            </Stack>}
        >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress 
                    variant='determinate' 
                    size={80} 
                    value={value} 
                    color={progressColor}
                    sx={{ opacity:progressColor === 'inherit' || hasLowOpacity ? 0.2 : 1 }} 
                    {...props} 
                />
                <Stack
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                    }}
                >
                    {children || (
                        <TimerIcon
                            color={progressColor}
                            sx={{ opacity: progressColor === 'inherit' || hasLowOpacity ? 0.3 : 1 }}
                        /> 
                    )}
                </Stack>
            </Box>
        </Tooltip>
    );
}

export default GameTimer;