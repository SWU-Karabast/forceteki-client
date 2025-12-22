import {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import GameTimer from '@/app/_components/_sharedcomponents/GameTimer/GameTimer';
import { MAX_MAIN_TIME, MAX_TURN_TIME, TimeRemainingStatus } from '@/app/_components/_sharedcomponents/GameTimer/TimeRemaining';
import { Stack, Typography } from '@mui/material';
import TimerIcon from '@/app/_components/_sharedcomponents/GameTimer/TimerIcon';

interface TimerContainerProps extends CircularProgressProps {
    player: {
        // TODO: Include values for turn and main time remaining, so that we can show accurate time on refresh?
        timeRemainingStatus: keyof typeof TimeRemainingStatus,
        mainTimeRemainingStatus: keyof typeof TimeRemainingStatus,
        isActionPhaseActivePlayer?: boolean
    } | null;
    label: string;
}

const TimerContainer: React.FC<TimerContainerProps> = ({ player, label, ...props }) => {
    const timeRemainingStatus = player?.timeRemainingStatus as keyof typeof TimeRemainingStatus;
    const mainTimeRemainingStatus = player?.mainTimeRemainingStatus as keyof typeof TimeRemainingStatus || TimeRemainingStatus.NoAlert;

    return (
        <Stack direction='column' alignItems='center' spacing={1} >
            <Typography variant="body2" sx={{ opacity: 0.5 }}>{label}</Typography>
            <GameTimer 
                maxTime={MAX_TURN_TIME} 
                timeRemainingStatus={timeRemainingStatus}
                isActive={player?.isActionPhaseActivePlayer} 
                tooltipLabel='Turn Time Remaining'
                {...props}
            >
                <TimerIcon />
            </GameTimer>
            <GameTimer 
                isActive={player?.isActionPhaseActivePlayer && timeRemainingStatus === TimeRemainingStatus.OutOfTime}
                maxTime={MAX_MAIN_TIME} 
                timeRemainingStatus={mainTimeRemainingStatus as keyof typeof TimeRemainingStatus} 
                tooltipLabel='Main Time Remaining'
                {...props}
            />
        </Stack>
    );
}

export default TimerContainer;