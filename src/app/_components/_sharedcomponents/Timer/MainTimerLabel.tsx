import React, { useLayoutEffect, useState } from 'react';
import { Box, Stack, Typography, useMediaQuery } from '@mui/material';
import { keyframes } from '@mui/system';
import {
    formatMilliseconds,
    IMainTimeGrantAnimation,
    MAIN_TIME_GRANT_ANIMATION_MS,
    MAIN_TIME_GRANT_COLOR,
    MAIN_TIME_GRANT_COUNT_UP_MS,
    MAX_MAIN_TIME,
} from './timerUtils';

const labelDefaultStyles = {
    marginBottom: 0,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: { xs: '0.8rem', md: '1rem' }
};

const grantGlow = keyframes`
    0% { transform: scale(1); text-shadow: none; }
    12% { transform: scale(1.2); color: ${MAIN_TIME_GRANT_COLOR}; text-shadow: 0 0 8px ${MAIN_TIME_GRANT_COLOR}; }
    45% { transform: scale(1); color: ${MAIN_TIME_GRANT_COLOR}; text-shadow: 0 0 6px ${MAIN_TIME_GRANT_COLOR}; }
    100% { transform: scale(1); text-shadow: none; }
`;

const chipFloat = keyframes`
    0% { opacity: 0; transform: translate(0, 4px) scale(0.7); }
    12% { opacity: 1; transform: translate(0, 0) scale(1.1); }
    20% { transform: translate(0, 0) scale(1); }
    75% { opacity: 1; transform: translate(0, -6px); }
    100% { opacity: 0; transform: translate(0, -12px); }
`;

// the chip for players who prefer reduced motion: it appears and fades where it is
const chipFade = keyframes`
    0% { opacity: 0; }
    12%, 75% { opacity: 1; }
    100% { opacity: 0; }
`;

const styles = {
    value: {
        position: 'relative',
    },
    grantChip: {
        // just outside the ring, which the label sits in the middle of
        position: 'absolute',
        left: { xs: 'calc(100% + 11px)', md: 'calc(100% + 26px)' },
        top: 0,
        zIndex: 1,
        fontSize: { xs: '0.6rem', md: '0.75rem' },
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        color: MAIN_TIME_GRANT_COLOR,
        textShadow: '0 0 4px rgba(0, 0, 0, 0.9)',
        pointerEvents: 'none',
        opacity: 0,
        animation: `${chipFloat} ${MAIN_TIME_GRANT_ANIMATION_MS}ms ease-out`,
        '@media (prefers-reduced-motion: reduce)': {
            animation: `${chipFade} ${MAIN_TIME_GRANT_ANIMATION_MS}ms linear`,
        },
    },
};

const Divider = () => <div style={{ height: '1px', width: '100%', background: 'white', opacity: 0.3, marginTop: '2px' }} />;

/**
 * The value a main time label shows while a grant is counting up to its new value, or null once it has (or when the
 * player prefers reduced motion, which shows the new value at once).
 *
 * The count-up starts in a layout effect: the game state that brings a grant already carries the new main time, so
 * starting it after the first paint would show the new value for a frame before dropping back to count up to it.
 */
const useGrantCountUp = (grant: IMainTimeGrantAnimation | null | undefined): number | null => {
    const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    const [valueMs, setValueMs] = useState<number | null>(null);

    useLayoutEffect(() => {
        if (!grant || prefersReducedMotion) {
            setValueMs(null);
            return;
        }

        let frame = 0;
        const start = performance.now();
        const step = (now: number) => {
            // a frame's timestamp can be a little earlier than `start`
            const progress = Math.min(1, Math.max(0, (now - start) / MAIN_TIME_GRANT_COUNT_UP_MS));
            const eased = 1 - Math.pow(1 - progress, 3);
            setValueMs(progress < 1 ? grant.fromMs + (grant.toMs - grant.fromMs) * eased : null);
            if (progress < 1) {
                frame = requestAnimationFrame(step);
            }
        };

        setValueMs(grant.fromMs);
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [grant, prefersReducedMotion]);

    return valueMs;
};

interface MainTimeValueProps {
    timeRemaining: number;
    color: string;
    isActive?: boolean;
    grant?: IMainTimeGrantAnimation | null;
}

/** One player's main time, which glows and counts up to its new value when the end of a round gives some back. */
const MainTimeValue: React.FC<MainTimeValueProps> = ({ timeRemaining, color, isActive, grant }) => {
    const countUpMs = useGrantCountUp(grant);

    return (
        <Box sx={styles.value}>
            <Typography
                key={grant?.round}
                variant="body1"
                sx={{
                    ...labelDefaultStyles,
                    color,
                    opacity: isActive || grant ? 1 : 0.65,
                    animation: grant ? `${grantGlow} ${MAIN_TIME_GRANT_ANIMATION_MS}ms ease-out` : 'none',
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
            >{formatMilliseconds(countUpMs ?? timeRemaining)}</Typography>
            {grant && (
                <Typography
                    key={`chip-${grant.round}`}
                    aria-label={`${grant.seconds} seconds of main time added`}
                    sx={styles.grantChip}
                >+{grant.seconds}s</Typography>
            )}
        </Box>
    );
};

interface MainTimerLabelProps {
    playerIsActive?: boolean;
    opponentIsActive?: boolean;
    playerIsTurnTime?: boolean;
    opponentIsTurnTime?: boolean;
    playerTimeRemaining?: number;
    opponentTimeRemaining?: number;
    playerGrant?: IMainTimeGrantAnimation | null;
    opponentGrant?: IMainTimeGrantAnimation | null;
}

const MainTimerLabel: React.FC<MainTimerLabelProps> = ({
    playerIsActive,
    opponentIsActive,
    playerIsTurnTime,
    opponentIsTurnTime,
    playerTimeRemaining = MAX_MAIN_TIME,
    opponentTimeRemaining = MAX_MAIN_TIME,
    playerGrant,
    opponentGrant,
}) => (
    <Stack spacing={0}>
        <MainTimeValue
            timeRemaining={opponentTimeRemaining}
            color="var(--initiative-red)"
            isActive={opponentIsActive && !opponentIsTurnTime}
            grant={opponentGrant}
        />
        <Divider />
        <MainTimeValue
            timeRemaining={playerTimeRemaining}
            color="var(--initiative-blue)"
            isActive={playerIsActive && !playerIsTurnTime}
            grant={playerGrant}
        />
    </Stack>
);

export default MainTimerLabel;
