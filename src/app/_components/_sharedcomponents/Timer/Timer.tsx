import CircularProgress, {
    CircularProgressProps,
} from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import React, { useMemo } from 'react';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/system';
import {
    formatMilliseconds,
    getTimerColor,
    IMainTimeGrantAnimation,
    MAIN_TIME_GRANT_ANIMATION_MS,
    MAIN_TIME_GRANT_COLOR,
    MAX_MAIN_TIME,
} from './timerUtils';
import { useMediaQuery, useTheme } from '@mui/material';

const TIMER_STEP = 100; // shorter intervals provide a smoother progress animation

const grantOverlayShow = keyframes`
    0% { opacity: 0; }
    10% { opacity: 1; }
    85% { opacity: 1; }
    100% { opacity: 0; }
`;

const grantRingHide = keyframes`
    0% { opacity: 1; }
    10% { opacity: 0; }
    85% { opacity: 0; }
    100% { opacity: 1; }
`;

const grantSegmentFlash = keyframes`
    0%, 14% { opacity: 0; }
    22% { opacity: 1; }
    30% { opacity: 0.25; }
    38% { opacity: 1; }
    46% { opacity: 0.25; }
    54%, 100% { opacity: 1; }
`;

interface TimerProps extends CircularProgressProps {
    activeTurn?: 'player' | 'opponent';
    children?: React.ReactNode;

    /**
     * A grant of main time to show on the ring: for as long as it lasts the ring shows the player's main time instead,
     * with the time given back flashing into place at the end of the arc.
     */
    grantOverlay?: IMainTimeGrantAnimation | null;
    hideProgressIndicator?: boolean;
    isRunning?: boolean;
    isTurnTime?: boolean;
    maxTime: number;
    setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
    timeRemaining: number;
    tooltipTitle?: TooltipProps['title'];
}

const styles = {
    container: { 
        position: 'relative', 
        display: 'inline-flex'
    }
}

/** The player's main time on the ring, with the time a grant gave back flashing in at the end of the arc. */
const GrantRing: React.FC<{ grant: IMainTimeGrantAnimation, size: number }> = ({ grant, size }) => {
    const fromPercent = (grant.fromMs / MAX_MAIN_TIME) * 100;
    const segmentPercent = ((grant.toMs - grant.fromMs) / MAX_MAIN_TIME) * 100;

    return (
        <Box
            key={grant.round}
            sx={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                opacity: 0,
                animation: `${grantOverlayShow} ${MAIN_TIME_GRANT_ANIMATION_MS}ms ease-in-out`,
            }}
        >
            <CircularProgress
                variant="determinate"
                size={size}
                value={fromPercent}
                sx={{ position: 'absolute', inset: 0, color: 'var(--initiative-blue)' }}
            />
            {/* the segment is drawn from the top like any arc, then turned to start where the main time ended */}
            <Box sx={{ position: 'absolute', inset: 0, transform: `rotate(${fromPercent * 3.6}deg)` }}>
                <CircularProgress
                    variant="determinate"
                    size={size}
                    value={segmentPercent}
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        color: MAIN_TIME_GRANT_COLOR,
                        filter: `drop-shadow(0 0 3px ${MAIN_TIME_GRANT_COLOR})`,
                        animation: `${grantSegmentFlash} ${MAIN_TIME_GRANT_ANIMATION_MS}ms linear`,
                    }}
                />
            </Box>
        </Box>
    );
};

const Timer: React.FC<TimerProps> = ({
    activeTurn,
    children,
    grantOverlay,
    hideProgressIndicator = false,
    isRunning = true,
    isTurnTime = false,
    maxTime,
    setTimeRemaining,
    timeRemaining,
    tooltipTitle,
    ...props }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const size = isMobile ? 44 : 80;
    // the ring is not drawn when hidden, and the flash is left out for players who prefer reduced motion
    const shownGrant = hideProgressIndicator || prefersReducedMotion ? null : grantOverlay ?? null;
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
            <Box sx={styles.container}>
                <Box
                    key={shownGrant?.round}
                    sx={{
                        display: 'flex',
                        animation: shownGrant ? `${grantRingHide} ${MAIN_TIME_GRANT_ANIMATION_MS}ms ease-in-out` : 'none',
                    }}
                >
                    <CircularProgress
                        variant='determinate'
                        size={size}
                        value={(timeRemaining / (maxTime / 100))} // Must be value between 0-100
                        sx={{
                            color: timerColor,
                            opacity: timerOpacity,
                            visibility: hideProgressIndicator ? 'hidden' : 'visible',
                        }}
                        {...props}
                    />
                </Box>
                {shownGrant && <GrantRing grant={shownGrant} size={size} />}
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