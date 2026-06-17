'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Typography, Tooltip } from '@mui/material';
import { FormatListBulleted, ChevronRight } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';

const PLAYER_COLORS: Record<string, string> = {
    'Player 1': 'var(--initiative-blue)',
    'Player 2': 'var(--selection-blue)',
};

const MoveList: React.FC = () => {
    const { moves, currentMoveIndex, seekToSeq, totalFrames } = useReplay();
    const [open, setOpen] = useState(true);
    const activeRef = useRef<HTMLDivElement | null>(null);

    // Keep the current beat in view as playback advances.
    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [currentMoveIndex]);

    if (totalFrames === 0) return null;

    if (!open) {
        return (
            <Tooltip title="Show move list">
                <IconButton
                    onClick={() => setOpen(true)}
                    sx={{
                        position: 'fixed', top: 76, right: 12, zIndex: 1305,
                        color: 'white', backgroundColor: 'rgba(0,0,0,0.6)',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
                    }}
                >
                    <FormatListBulleted />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 68,
                right: 0,
                bottom: 60, // clear the transport bar
                width: { xs: '70vw', sm: 300 },
                backgroundColor: 'rgba(0,0,0,0.78)',
                backdropFilter: 'blur(10px)',
                borderLeft: '1px solid rgba(255,255,255,0.12)',
                zIndex: 1305,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: '0.04em' }}>
                    MOVES
                </Typography>
                <Tooltip title="Hide move list">
                    <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        <ChevronRight />
                    </IconButton>
                </Tooltip>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
                {moves.length === 0 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', px: 1.5, py: 1 }}>
                        No moves recorded in this replay.
                    </Typography>
                )}
                {moves.map((move, i) => {
                    const isCurrent = i === currentMoveIndex;
                    return (
                        <Box
                            key={`${move.seq}-${i}`}
                            ref={isCurrent ? activeRef : undefined}
                            onClick={() => seekToSeq(move.seq)}
                            sx={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: 1,
                                px: 1.5,
                                py: 0.5,
                                cursor: 'pointer',
                                borderLeft: '2px solid',
                                borderLeftColor: isCurrent ? 'var(--initiative-blue)' : 'transparent',
                                backgroundColor: isCurrent ? 'rgba(0,186,255,0.14)' : 'transparent',
                                '&:hover': { backgroundColor: isCurrent ? 'rgba(0,186,255,0.18)' : 'rgba(255,255,255,0.06)' },
                            }}
                        >
                            <Typography
                                component="span"
                                sx={{
                                    fontSize: '0.7rem',
                                    minWidth: 16,
                                    textAlign: 'center',
                                    color: PLAYER_COLORS[move.player] ?? 'rgba(255,255,255,0.4)',
                                    fontWeight: 700,
                                }}
                            >
                                {move.player === 'Player 1' ? '1' : move.player === 'Player 2' ? '2' : '·'}
                            </Typography>
                            <Typography
                                component="span"
                                sx={{
                                    fontSize: '0.82rem',
                                    color: isCurrent ? 'white' : 'rgba(255,255,255,0.7)',
                                    fontWeight: 400,
                                }}
                            >
                                {move.label}
                            </Typography>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default MoveList;
