'use client';
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';

/** Previous/next beat, reachable without leaving the board. Sits over the arena edges at
 *  vertical center; 48px targets. Hidden under the panel's rail on the right, so the right
 *  chevron clears the 48px collapsed rail (panel open: the panel covers it, which is fine —
 *  the panel has its own step affordances). */
const side = (edge: 'left' | 'right') => ({
    position: 'absolute' as const, top: '50%', transform: 'translateY(-50%)', [edge]: edge === 'right' ? 56 : 8,
    width: 48, height: 96, borderRadius: '10px', color: 'white', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
    border: '1px solid rgba(255,255,255,0.15)', zIndex: 6, '&:hover': { backgroundColor: 'rgba(0,186,255,0.25)' },
    '&.Mui-disabled': { color: 'rgba(255,255,255,0.25)' },
});
const BoardChevrons: React.FC = () => {
    const { stepBack, stepForward, currentBeat, beats } = useReplay();
    return (
        <>
            <Tooltip title="Previous beat (←)" placement="right"><span><IconButton aria-label="Previous beat" onClick={stepBack} disabled={currentBeat.index === 0} sx={side('left')}><ChevronLeft fontSize="large" /></IconButton></span></Tooltip>
            <Tooltip title="Next beat (→)" placement="left"><span><IconButton aria-label="Next beat" onClick={stepForward} disabled={currentBeat.index >= beats.length - 1} sx={side('right')}><ChevronRight fontSize="large" /></IconButton></span></Tooltip>
        </>
    );
};
export default BoardChevrons;
