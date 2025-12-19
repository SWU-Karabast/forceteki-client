import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import React, { useMemo } from 'react';
import { Stack } from '@mui/material';

interface PlayerTimerProps extends CircularProgressProps {}

const PlayerTimer: React.FC<PlayerTimerProps> = (props) => {
    const MAX_TURN_TIME = 30_000; // 30 seconds in 100ms units
    const MAX_MAIN_TIME = 150_000; // 150 seconds in 100ms units
    const [turnTime, setTurnTime] = React.useState(MAX_TURN_TIME);
    const [mainTime, setMainTime] = React.useState(MAX_MAIN_TIME);

    // Decrease turn time every second
    React.useEffect(() => {
        const timer = setInterval(() => {
            setTurnTime((prevTurnTime) => prevTurnTime > 0 ? prevTurnTime - 1000 : 0);
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    // Decrease main time every second when turn time is depleted
    React.useEffect(() => {
        const timer = setInterval(() => {
            if (turnTime === 0) {
                setMainTime((prevMainTime) => prevMainTime > 0 ? prevMainTime - 1000 : 0);
            }
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, [turnTime]);

    // Reset turn and main time when main time reaches 0
    React.useEffect(() => {
        const timer = setInterval(() => {
            if(mainTime === 0){
                setTurnTime(MAX_TURN_TIME);
                setMainTime(MAX_MAIN_TIME);
            }
        }, 3000);

        return () => {
            clearInterval(timer);
        };
    }, [mainTime]);

    const progressColor = useMemo(() => turnTime > 15_000 ? 'primary' : turnTime > 5_000 ? 'warning' : 'error', [turnTime]);

    const value = useMemo(() => {
        if(turnTime > 0) {
            return (turnTime / (MAX_TURN_TIME / 100));
        } else {
            return 100 // When turn time is 0, show full circle
        }
    }, [turnTime, MAX_TURN_TIME]);

    return (
        <Tooltip
            arrow={true}
            title={<Stack>
                <Typography variant="body2" fontWeight='600'>
                    Game Timer
                </Typography>
                <Typography variant="body2">
                    Turn Time: {(turnTime / 1000).toFixed(0)}s
                </Typography>
                <Typography variant="body2">
                    Main Time: {(mainTime / 1000).toFixed(0)}s
                </Typography>
            </Stack>}
        >
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant='determinate' size={50} value={value} color={progressColor} {...props} />
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
                    <Typography
                        variant="caption"
                        component="div"
                        sx={{ color: 'white' }}
                    >{`${mainTime / 1000}s`}</Typography>
                </Box>
            </Box>
        </Tooltip>
    );
}

export default PlayerTimer;