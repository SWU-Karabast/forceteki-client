import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import React from 'react';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Stack, useTheme } from '@mui/material';
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
    const theme = useTheme();

    // Decreases turn time every 100ms, to provide a smooth countdown animation
    React.useEffect(() => {
        const timer = setInterval(() => {
            isRunning ? setTimeRemaining((prevTimeRemaining) => prevTimeRemaining > 0 ? prevTimeRemaining - TIMER_STEP : maxTime) : null;
        }, TIMER_STEP);

        return () => {
            clearInterval(timer);
        };
    }, [isRunning, maxTime, setTimeRemaining]);

    const progressColor = timeRemaining > (maxTime / 3) || hasLowOpacity
        ? 'inherit'
        : timeRemaining > (maxTime / 6)
            ? 'warning'
            : 'error';

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
                    value={(timeRemaining / (maxTime / 100))} // Must be value between 0-100
                    color={progressColor}
                    sx={{ opacity: progressColor === 'inherit' || hasLowOpacity ? 0.15 : 1 }} 
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
                        backgroundColor: progressColor === 'inherit' 
                            ? `${theme.palette.grey[800]}33` 
                            : `${theme.palette[progressColor].main}55`, 
                        borderRadius: '100%',
                    }}
                >
                    {children || (
                        <Typography
                            variant="body1"
                            sx={{ color: progressColor, marginBottom: '2px', opacity: hasLowOpacity ? 0.3 : 1 }}
                        >{`${formatMilliseconds(timeRemaining)}`}</Typography> 
                    )}
                </Stack>
            </Box>
        </Tooltip>
    );
}

export default GameTimer;