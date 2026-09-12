'use client';
import React, { useEffect, useCallback, useMemo } from 'react';
import { Box, IconButton, Slider, Tooltip, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material';
import {
    PlayArrow,
    Pause,
    SkipPrevious,
    SkipNext,
    SwapHoriz,
} from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { formatRoundPhase } from '@/app/_utils/replayMoves';
import { beatAt } from '@/app/_utils/replayBeats';
import { SPEEDS } from '@/app/_utils/replayTiming';

const TransportControls: React.FC = () => {
    const {
        isPlaying,
        play,
        pause,
        stepForward,
        stepBack,
        stepRecordForward,
        stepRecordBack,
        speed,
        setSpeed,
        currentIndex,
        totalFrames,
        events,
        roundMarks,
        beats,
        currentBeat,
        seekToBeat,
        togglePerspective,
        currentPerspective,
    } = useReplay();

    const currentRound = formatRoundPhase(events[currentIndex]?.seq ?? '');

    // One DOM node per mark. A file with thousands of ROUND_STARTs is hostile, not a game;
    // keep the landmarks legible and bounded. The slider now scrubs by BEAT, so each mark's
    // frame is remapped to the beat that contains it.
    const sliderMarks = useMemo(() => {
        const MAX_MARKS = 100;
        const marks = roundMarks.length <= MAX_MARKS
            ? roundMarks
            : roundMarks.filter((_, i) => i % Math.ceil(roundMarks.length / MAX_MARKS) === 0);
        return marks.map((m) => ({ value: beatAt(beats, m.value).index, label: m.label }));
    }, [roundMarks, beats]);

    const formatPosition = (value: number) => {
        const seq = events[beats[value]?.anchor]?.seq;
        return (seq && formatRoundPhase(seq)) || `${value + 1} / ${beats.length}`;
    };

    const handlePlayPause = useCallback(() => {
        if (isPlaying) pause();
        else play();
    }, [isPlaying, play, pause]);

    const handleSpeedChange = useCallback((_: React.MouseEvent<HTMLElement>, newSpeed: number | null) => {
        if (newSpeed !== null) setSpeed(newSpeed);
    }, [setSpeed]);

    const handleSliderChange = useCallback((_: Event, value: number | number[]) => {
        seekToBeat(value as number);
    }, [seekToBeat]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Global shortcuts apply only when nothing interactive has focus. Arrows only
            // back off for an actual text/slider control — a focused move row (a SeekRow,
            // role="button") used to swallow them too, which is why clicking a row then
            // pressing an arrow did nothing.
            const target = e.target as HTMLElement | null;
            if (target?.closest?.('input, textarea, select, [role="slider"], [contenteditable="true"]')) return;
            // Space still backs off a focused button/link/tab so it activates that control
            // instead of double-firing play/pause.
            if (e.key === ' ' && target?.closest?.('button, [role="button"], a[href], [role="tab"]')) return;

            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    if (e.shiftKey) stepRecordBack(); else stepBack();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    if (e.shiftKey) stepRecordForward(); else stepForward();
                    break;
                case '[': {
                    const currentSpeedIdx = (SPEEDS as readonly number[]).indexOf(speed);
                    if (currentSpeedIdx > 0) setSpeed(SPEEDS[currentSpeedIdx - 1]);
                    break;
                }
                case ']': {
                    const currentSpeedIdx = (SPEEDS as readonly number[]).indexOf(speed);
                    if (currentSpeedIdx < SPEEDS.length - 1) setSpeed(SPEEDS[currentSpeedIdx + 1]);
                    break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePlayPause, stepBack, stepForward, stepRecordBack, stepRecordForward, speed, setSpeed]);

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
                px: { xs: 0.75, sm: 2 },
                gap: { xs: 0.25, sm: 1.5 },
                zIndex: 1300,
                borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            <Tooltip title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                <IconButton aria-label={isPlaying ? 'Pause' : 'Play'} onClick={handlePlayPause} sx={{ color: 'white' }}>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
            </Tooltip>

            <Tooltip title="Step back (←)">
                <span>
                    <IconButton aria-label="Step back one frame" onClick={stepBack} disabled={currentIndex === 0} sx={{ color: 'white' }}>
                        <SkipPrevious />
                    </IconButton>
                </span>
            </Tooltip>

            <Tooltip title="Step forward (→)">
                <span>
                    <IconButton aria-label="Step forward one frame" onClick={stepForward} disabled={currentIndex >= totalFrames - 1} sx={{ color: 'white' }}>
                        <SkipNext />
                    </IconButton>
                </span>
            </Tooltip>

            {/* Visually hidden, but the units matter: MUI's sx reads a bare 0-1 number on
                width/height as a PERCENTAGE, so `width: 1` was 100% — a 375px child inside a
                375px bar that already had padding, pushing scrollWidth to 381 and giving the
                fixed bar a horizontal overflow on a phone. `clip` hid it, so it only showed
                up as a bar that could be nudged sideways. */}
            <Box aria-live="polite" sx={{
                position: 'absolute', width: '1px', height: '1px', overflow: 'hidden',
                clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap',
            }}>
                {/* Silent during autoplay: at 8x that was several announcements a second, and
                    a screen reader never finished one before the next arrived. */}
                {isPlaying ? '' : `Frame ${currentIndex + 1} of ${totalFrames}${currentRound ? `, ${currentRound}` : ''}`}
            </Box>
            <Slider
                aria-label="Replay position"
                getAriaValueText={formatPosition}
                value={currentBeat.index}
                min={0}
                max={Math.max(0, beats.length - 1)}
                marks={sliderMarks}
                onChange={handleSliderChange}
                valueLabelDisplay="auto"
                valueLabelFormat={formatPosition}
                sx={{
                    flex: 1,
                    mx: { xs: 0.5, sm: 1 },
                    color: 'var(--initiative-blue)',
                    '& .MuiSlider-thumb': { width: 14, height: 14 },
                    '& .MuiSlider-mark': {
                        width: 3,
                        height: 10,
                        borderRadius: 1,
                        backgroundColor: 'rgba(255,255,255,0.5)',
                    },
                    '& .MuiSlider-markActive': { backgroundColor: 'var(--selection-blue)' },
                    '& .MuiSlider-valueLabel': {
                        backgroundColor: 'rgba(0,0,0,0.85)',
                        fontSize: '0.7rem',
                    },
                }}
            />

            {/* Everything below is hidden on a phone. The bar is a fixed 60px row, and at
                375px the labels + speed group leave the slider about 45px — narrow enough
                that the round marks collapse into each other and scrubbing is guesswork.
                Nothing here is the only copy of its information: position and round both
                ride the slider's value label, and the perspective is in the swap button's
                aria-label. Playback speed is the one real loss; stepping and scrubbing
                still work, and a speed picker that survives 375px needs a menu, not a row. */}
            <Typography variant="body2" sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'rgba(255,255,255,0.7)', minWidth: '70px', textAlign: 'center',
            }}>
                {currentBeat.index + 1} / {beats.length}
            </Typography>

            {currentRound && (
                <Typography variant="body2" sx={{
                    display: { xs: 'none', sm: 'block' },
                    color: 'rgba(255,255,255,0.5)', minWidth: '140px', textAlign: 'center',
                }}>
                    {currentRound}
                </Typography>
            )}

            <ToggleButtonGroup
                aria-label="Playback speed"
                value={speed}
                exclusive
                onChange={handleSpeedChange}
                size="small"
                sx={{
                    display: { xs: 'none', sm: 'flex' },
                    '& .MuiToggleButton-root': {
                        color: 'rgba(255,255,255,0.5)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        px: 1,
                        py: 0.25,
                        fontSize: '0.75rem',
                        '&.Mui-selected': {
                            color: 'var(--initiative-blue)',
                            backgroundColor: 'rgba(0,186,255,0.15)',
                        },
                    },
                }}
            >
                {SPEEDS.map((s) => (
                    <ToggleButton key={s} value={s} aria-label={`${s} times speed`}>
                        {s}x
                    </ToggleButton>
                ))}
            </ToggleButtonGroup>

            <Typography variant="body2" sx={{
                display: { xs: 'none', sm: 'block' },
                color: 'rgba(255,255,255,0.7)', minWidth: '64px', textAlign: 'right',
            }}>
                {currentPerspective}
            </Typography>
            <Tooltip title={`Viewing as ${currentPerspective} — swap perspective`}>
                <IconButton
                    aria-label={`Viewing as ${currentPerspective}. Swap perspective`}
                    onClick={togglePerspective}
                    sx={{ color: 'white' }}
                >
                    <SwapHoriz />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default TransportControls;
