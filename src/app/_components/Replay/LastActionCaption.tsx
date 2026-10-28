'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useReplay } from '@/app/_contexts/Replay.context';

// Slide-and-fade the caption in each time the beat changes. The `key={currentBeat.index}`
// below remounts the bar on every new beat, so this replays once per beat, not per record.
const captionIn = keyframes`
  from { opacity: 0; transform: translate(-50%, 8px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
`;

/**
 * Caption bar that narrates the current beat, sitting just above the transport bar, so
 * each step reads as "what just happened".
 */
const LastActionCaption: React.FC = () => {
    const { currentEvents, captionExtra, currentBeat } = useReplay();

    if (currentEvents.length === 0) return null;

    const headline = currentEvents[currentEvents.length - 1];

    return (
        <Box
            key={currentBeat.index}
            sx={styles.bar}
        >
            <Typography variant="body2" sx={styles.headline}>
                {headline}
            </Typography>
            {captionExtra > 0 && (
                <Typography variant="caption" sx={styles.extra}>
                    +{captionExtra} records
                </Typography>
            )}
        </Box>
    );
};

export default LastActionCaption;

// ----------------Styles----------------//
const styles = {
    bar: {
        position: 'fixed',
        bottom: 68, // just above the 60px transport bar
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: '70vw',
        px: 2,
        py: 0.75,
        borderRadius: '8px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,186,255,0.25)',
        zIndex: 1304,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        pointerEvents: 'none',
        animation: `${captionIn} 0.22s ease-out`,
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    },
    headline: {
        color: 'white',
        fontWeight: 600,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    extra: {
        color: 'var(--initiative-blue)',
        whiteSpace: 'nowrap',
    },
};
