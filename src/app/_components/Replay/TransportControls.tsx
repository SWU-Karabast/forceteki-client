'use client';
import React, { useEffect, useCallback } from 'react';
import { Box, IconButton, Slider, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
    PlayArrow,
    Pause,
    SkipPrevious,
    SkipNext,
    SwapHoriz,
} from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';

const SPEEDS = [0.5, 1, 2, 4];

function parseRoundFromSeq(seq: string): string {
    const match = seq.match(/^R(\d+)\.([A-Z])/);
    if (!match) return '';
    const round = match[1];
    const phase = match[2] === 'A' ? 'Action' : match[2] === 'R' ? 'Regroup' : match[2];
    return `Round ${round}, ${phase} Phase`;
}

const TransportControls: React.FC = () => {
    const {
        isPlaying,
        play,
        pause,
        stepForward,
        stepBack,
        speed,
        setSpeed,
        currentIndex,
        totalSnapshots,
        seekTo,
        togglePerspective,
        currentPerspective,
        snapshots,
    } = useReplay();

    const currentRound = snapshots[currentIndex]
        ? parseRoundFromSeq(snapshots[currentIndex].seq)
        : '';

    const handlePlayPause = useCallback(() => {
        if (isPlaying) pause();
        else play();
    }, [isPlaying, play, pause]);

    const handleSpeedChange = useCallback((_: React.MouseEvent<HTMLElement>, newSpeed: number | null) => {
        if (newSpeed !== null) setSpeed(newSpeed);
    }, [setSpeed]);

    const handleSliderChange = useCallback((_: Event, value: number | number[]) => {
        seekTo(value as number);
    }, [seekTo]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    stepBack();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    stepForward();
                    break;
                case '[': {
                    const currentSpeedIdx = SPEEDS.indexOf(speed);
                    if (currentSpeedIdx > 0) setSpeed(SPEEDS[currentSpeedIdx - 1]);
                    break;
                }
                case ']': {
                    const currentSpeedIdx = SPEEDS.indexOf(speed);
                    if (currentSpeedIdx < SPEEDS.length - 1) setSpeed(SPEEDS[currentSpeedIdx + 1]);
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePlayPause, stepBack, stepForward, speed, setSpeed]);

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '60px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                px: 2,
                gap: 1.5,
                zIndex: 1300,
                borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            <IconButton onClick={handlePlayPause} sx={{ color: 'white' }}>
                {isPlaying ? <Pause /> : <PlayArrow />}
            </IconButton>

            <IconButton onClick={stepBack} disabled={currentIndex === 0} sx={{ color: 'white' }}>
                <SkipPrevious />
            </IconButton>

            <IconButton onClick={stepForward} disabled={currentIndex >= totalSnapshots - 1} sx={{ color: 'white' }}>
                <SkipNext />
            </IconButton>

            <Slider
                value={currentIndex}
                min={0}
                max={totalSnapshots - 1}
                onChange={handleSliderChange}
                sx={{
                    flex: 1,
                    mx: 1,
                    color: '#90caf9',
                    '& .MuiSlider-thumb': { width: 14, height: 14 },
                }}
            />

            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', minWidth: '70px', textAlign: 'center' }}>
                {currentIndex + 1} / {totalSnapshots}
            </Typography>

            {currentRound && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', minWidth: '140px', textAlign: 'center' }}>
                    {currentRound}
                </Typography>
            )}

            <ToggleButtonGroup
                value={speed}
                exclusive
                onChange={handleSpeedChange}
                size="small"
                sx={{
                    '& .MuiToggleButton-root': {
                        color: 'rgba(255,255,255,0.5)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.75rem',
                        '&.Mui-selected': {
                            color: '#90caf9',
                            backgroundColor: 'rgba(144,202,249,0.15)',
                        },
                    },
                }}
            >
                {SPEEDS.map((s) => (
                    <ToggleButton key={s} value={s}>
                        {s}x
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            <IconButton
                onClick={togglePerspective}
                sx={{ color: 'white' }}
                title={`Viewing as ${currentPerspective}`}
            >
                <SwapHoriz />
            </IconButton>
        </Box>
    );
};

export default TransportControls;
