import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import React, { useMemo } from 'react';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material';
import { formatMilliseconds, getTimerColor } from './timerUtils';

const TIMER_STEP = 100; // shorter intervals provide a smoother progress animation
interface TimerProps extends CircularProgressProps {
    children?: React.ReactNode;
    hasLowOpacity?: boolean;
    isRunning?: boolean;
    maxTime: number;
    setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
    shouldAdjustBackgroundColor?: boolean;
    timeRemaining: number;
    tooltipTitle?: TooltipProps['title'];
}

const Timer: React.FC<TimerProps> = ({ 
    children, 
    hasLowOpacity,
    isRunning = true, 
    maxTime, 
    setTimeRemaining,
    shouldAdjustBackgroundColor = false,
    timeRemaining, 
    tooltipTitle,
    ...props }) => {
    const theme = useTheme();

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

    const { themeColor: timerColor } = useMemo(() => getTimerColor({
        timeRemaining,
        maxTime,
        hasLowOpacity
    }), [
        timeRemaining, maxTime, hasLowOpacity
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
                    color={timerColor}
                    sx={{ opacity: timerColor === 'inherit' 
                        ? 0.3
                        : hasLowOpacity 
                            ? 0.1
                            : 1, 
                    zIndex: 10 }} 
                    {...props} 
                />
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: timerColor === 'inherit' || !shouldAdjustBackgroundColor
                            ? `linear-gradient(135deg, ${theme.palette.grey[900]} 0%, ${theme.palette.grey[900]}55 100%)`
                            : `linear-gradient(135deg, ${theme.palette[timerColor].main} 0%, ${theme.palette[timerColor].main}55 100%)`,
                        borderRadius: '50%',
                        outline: '1px solid rgba(255, 255, 255, 0.15)',
                    }}
                >
                    {children || (
                        <Typography
                            variant="body1"
                            sx={{ color: timerColor, opacity: hasLowOpacity ? 0.3 : 1 }}
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