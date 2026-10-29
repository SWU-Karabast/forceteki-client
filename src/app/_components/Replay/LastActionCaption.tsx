'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useReplay } from '@/app/_contexts/Replay.context';
import { REPLAY_PANEL_WIDTH, REPLAY_TRANSPORT_HEIGHT } from '@/app/_constants/replayLayout';
import type { ILastActionCaptionProps } from './ReplayTypes';

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
const LastActionCaption: React.FC<ILastActionCaptionProps> = ({ panelOpen }) => {
    const { currentEvents, captionExtra, currentBeat } = useReplay();

    if (currentEvents.length === 0) return null;

    const headline = currentEvents[currentEvents.length - 1];

    return (
        <Box
            key={currentBeat.index}
            sx={styles.bar(panelOpen)}
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
    // From md up an open panel sits beside the board (page.tsx narrows <main>), so the caption
    // centres on the board column instead of the viewport, where it would slide under the panel.
    bar: (panelOpen: boolean) => ({
        position: 'fixed',
        bottom: REPLAY_TRANSPORT_HEIGHT + 8, // just above the transport bar
        left: panelOpen ? { xs: '50%', md: `calc((100vw - ${REPLAY_PANEL_WIDTH}px) / 2)` } : '50%',
        transform: 'translateX(-50%)',
        maxWidth: panelOpen ? { xs: '70vw', md: `calc((100vw - ${REPLAY_PANEL_WIDTH}px) * 0.9)` } : '70vw',
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
    }),
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
