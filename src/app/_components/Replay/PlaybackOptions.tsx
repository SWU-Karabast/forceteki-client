'use client';
import React from 'react';
import { Box, Popover, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { SPEEDS } from '@/app/_utils/replayTiming';
import type { StepBy } from '@/app/_utils/replayPrefs';

interface PlaybackOptionsProps {
    anchorEl: HTMLElement | null;
    onClose: () => void;
}

const GROUP_SX = {
    '& .MuiToggleButton-root': {
        color: 'rgba(255,255,255,0.6)',
        borderColor: 'rgba(255,255,255,0.2)',
        px: 1.25,
        fontSize: '0.75rem',
        textTransform: 'none',
        '&.Mui-selected': { color: 'var(--initiative-blue)', backgroundColor: 'rgba(0,186,255,0.15)' },
    },
};

/** The Tune button's popover: speed, step unit and card animation, each a persisted
 *  preference (Task 14). Every ToggleButtonGroup is plain MUI buttons — Tab reaches
 *  them, Space/Enter picks. */
const PlaybackOptions: React.FC<PlaybackOptionsProps> = ({ anchorEl, onClose }) => {
    const { speed, setSpeed, stepBy, setStepBy, animate, setAnimate } = useReplay();

    return (
        <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            // MUI's default modal z-index (1300) sits BELOW the replay panel (1305, see
            // ReplayPanel.tsx) and the transport bar itself (1300), so without this the
            // popover paints under them — reachable by keyboard, invisible to the eye.
            sx={{ zIndex: 1400 }}
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: 'rgba(10,14,20,0.97)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1.5,
                    },
                },
            }}
        >
            <Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.55)', mb: 0.5 }}>Speed</Typography>
                <ToggleButtonGroup
                    aria-label="Speed"
                    value={speed}
                    exclusive
                    size="small"
                    sx={GROUP_SX}
                    onChange={(_, v: number | null) => { if (v !== null) setSpeed(v); }}
                >
                    {SPEEDS.map((s) => (
                        <ToggleButton key={s} value={s} aria-label={`${s} times speed`}>{s}x</ToggleButton>
                    ))}
                </ToggleButtonGroup>
            </Box>
            <Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.55)', mb: 0.5 }}>Step by</Typography>
                <ToggleButtonGroup
                    aria-label="Step by"
                    value={stepBy}
                    exclusive
                    size="small"
                    sx={GROUP_SX}
                    onChange={(_, v: StepBy | null) => { if (v !== null) setStepBy(v); }}
                >
                    <ToggleButton value="beat" aria-label="Step by beat">Beat</ToggleButton>
                    <ToggleButton value="record" aria-label="Step by record">Record</ToggleButton>
                </ToggleButtonGroup>
            </Box>
            <Box>
                <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.55)', mb: 0.5 }}>Card animation</Typography>
                <ToggleButtonGroup
                    aria-label="Card animation"
                    value={animate}
                    exclusive
                    size="small"
                    sx={GROUP_SX}
                    onChange={(_, v: boolean | null) => { if (v !== null) setAnimate(v); }}
                >
                    <ToggleButton value aria-label="Card animation on">On</ToggleButton>
                    <ToggleButton value={false} aria-label="Card animation off">Off</ToggleButton>
                </ToggleButtonGroup>
            </Box>
        </Popover>
    );
};

export default PlaybackOptions;
