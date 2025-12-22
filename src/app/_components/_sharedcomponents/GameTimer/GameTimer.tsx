import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import React, { useMemo } from 'react';
import { Stack } from '@mui/material';
import { TimeRemainingStatus } from './TimeRemaining';

interface GameTimerProps extends CircularProgressProps {
    isActive?: boolean;
    maxTime: number;
    timeRemainingStatus: keyof typeof TimeRemainingStatus;
    tooltipLabel?: string;
    children?: React.ReactNode;
}
const TIMER_STEP = 100; // shorter intervals provide a smoother progress animation

const GameTimer: React.FC<GameTimerProps> = ({ isActive, maxTime, timeRemainingStatus, tooltipLabel = 'Time Remaining', children, ...props }) => {
    const [timeRemaining, setTimeRemaining] = React.useState(maxTime);

    // Decrease turn time every interval
    React.useEffect(() => {
        const timer = setInterval(() => {
            isActive ? setTimeRemaining((prevTimeRemaining) => prevTimeRemaining > 0 ? prevTimeRemaining - TIMER_STEP : maxTime) : null;
        }, TIMER_STEP);

        return () => {
            clearInterval(timer);
        };
    }, [isActive, maxTime]);

    const progressColor = useMemo(() => 
        timeRemainingStatus === TimeRemainingStatus.NoAlert ? 'primary' 
            : timeRemainingStatus === TimeRemainingStatus.Warning ? 'warning' : 'error',
    [timeRemainingStatus]);

    const value = useMemo(() => {
        if(timeRemaining > 0) {
            return (timeRemaining / (maxTime / 100));
        } else {
            return 100 // When time is 0, show full circle
        }
    }, [timeRemaining, maxTime]);

    const hasLowOpacity = useMemo(() => !isActive 
    // || timeRemainingStatus === TimeRemainingStatus.NoAlert
        , [isActive, timeRemainingStatus]); 

    return (
        <Tooltip
            arrow={true}
            title={<Stack>
                <Typography variant="body2">
                    {tooltipLabel}: {formatMilliseconds(timeRemaining)}
                </Typography>
            </Stack>}
        >
            <Box sx={{ position: 'relative', display: 'inline-flex', ...(hasLowOpacity ? styles.lowOpacity : {}) }}>
                <CircularProgress variant='determinate' size={40} value={value} color={progressColor} {...props} />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {children ||
                        <Typography
                            variant="caption"
                            component="div"
                            sx={{ color: 'white' }}
                        >{`${formatMilliseconds(timeRemaining)}`}</Typography> 
                    }
                </Box>
            </Box>
        </Tooltip>
    );
}

const formatMilliseconds = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
}

const styles = {
    lowOpacity: {
        opacity: 0.3,
    }
}

export default GameTimer;