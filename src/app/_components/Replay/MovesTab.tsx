'use client';
import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useReplayAnnotations } from '@/app/_contexts/ReplayAnnotations.context';

const PLAYER_COLORS: Record<string, string> = {
    'Player 1': 'var(--initiative-blue)',
    'Player 2': '#ff9f43',
};

/** The move list, rendered inline as a panel tab body. Click a row to seek; the current
 *  move is highlighted and auto-scrolled into view; annotated moves show a chat marker. */
const MovesTab: React.FC = () => {
    const { moves, currentMoveIndex, seekToSeq } = useReplay();
    const { annotatedRefs } = useReplayAnnotations();
    const activeRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, [currentMoveIndex]);

    return (
        <Box sx={{ py: 0.5 }}>
            {moves.length === 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', px: 1.5 }}>No moves recorded.</Typography>
            )}
            {moves.map((move, i) => {
                const isCurrent = i === currentMoveIndex;
                const annotated = annotatedRefs.has(move.seq);
                return (
                    <Box
                        key={move.seq}
                        ref={isCurrent ? activeRef : undefined}
                        onClick={() => seekToSeq(move.seq)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, cursor: 'pointer',
                            borderLeft: isCurrent ? '3px solid var(--initiative-blue)' : '3px solid transparent',
                            backgroundColor: isCurrent ? 'rgba(0,186,255,0.12)' : 'transparent',
                            '&:hover': { backgroundColor: isCurrent ? 'rgba(0,186,255,0.16)' : 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 700, minWidth: 12, color: PLAYER_COLORS[move.player] ?? 'rgba(255,255,255,0.4)' }}>
                            {move.player === 'Player 1' ? '1' : move.player === 'Player 2' ? '2' : '·'}
                        </Box>
                        <Typography variant="body2" sx={{ flex: 1, color: isCurrent ? 'white' : 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>
                            {move.label}
                        </Typography>
                        {annotated && <ChatBubbleOutline sx={{ fontSize: 13, color: 'rgba(0,186,255,0.7)' }} />}
                    </Box>
                );
            })}
        </Box>
    );
};

export default MovesTab;
