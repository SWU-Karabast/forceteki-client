'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';

/**
 * Caption bar that narrates the events resolved in the current frame, sitting
 * just above the transport bar. Surfaces the event stream the replay already
 * parses so each step reads as "what just happened" instead of a silent jump.
 */
const LastActionCaption: React.FC = () => {
    const { currentEvents } = useReplay();

    if (currentEvents.length === 0) return null;

    // Lead with the most recent beat; summarize the rest.
    const headline = currentEvents[currentEvents.length - 1];
    const extra = currentEvents.length - 1;

    return (
        <Box
            sx={{
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
            }}
        >
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {headline}
            </Typography>
            {extra > 0 && (
                <Typography variant="caption" sx={{ color: 'var(--initiative-blue)', whiteSpace: 'nowrap' }}>
                    +{extra} more
                </Typography>
            )}
        </Box>
    );
};

export default LastActionCaption;
