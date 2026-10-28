'use client';
import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { ChatBubbleOutline } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import type { ReplayMove } from '@/app/_utils/swupgnMoves';
import { useReplayAnnotations } from '@/app/_contexts/ReplayAnnotations.context';
import { followIntoView } from '@/app/_utils/panelFollow';
import SeekRow from './SeekRow';

const PLAYER_COLORS: Record<string, string> = {
    'Player 1': 'var(--initiative-blue)',
    'Player 2': '#ff9f43',
};

interface IMoveRowProps {
    move: ReplayMove;
    index: number;
    isCurrent: boolean;
    annotated: boolean;
    onSeek: (seq: string) => void;
}

/** One move. Memoised, and every prop is stable across playback ticks (`onSeek` is the
 *  context's `useCallback`'d `seekToBeatOf`), so a tick re-renders only the two rows whose
 *  `isCurrent` flips rather than the whole list. */
const MoveRow = React.memo(function MoveRow({ move, index, isCurrent, annotated, onSeek }: IMoveRowProps) {
    return (
        <Box data-move-index={index}>
            <SeekRow
                onClick={() => onSeek(move.seq)}
                label={`${move.label}${annotated ? ', has notes' : ''}`}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6,
                    borderLeft: isCurrent ? '3px solid var(--initiative-blue)' : '3px solid transparent',
                    backgroundColor: isCurrent ? 'rgba(0,186,255,0.12)' : 'transparent',
                    '&:hover': { backgroundColor: isCurrent ? 'rgba(0,186,255,0.16)' : 'rgba(255,255,255,0.06)' },
                }}
            >
                <Box component="span" sx={{ fontSize: '0.7rem', fontWeight: 700, minWidth: 12, color: PLAYER_COLORS[move.player] ?? 'rgba(255,255,255,0.4)' }}>
                    {move.player === 'Player 1' ? '1' : move.player === 'Player 2' ? '2' : '·'}
                </Box>
                {/* Below md the theme's root font drops to 10-12px, which takes 0.82rem
                    under 10px on a phone; the 12px floor applies only there. */}
                <Typography variant="body2" sx={{ flex: 1, color: isCurrent ? 'white' : 'rgba(255,255,255,0.8)', fontSize: { xs: 'max(12px, 0.82rem)', md: '0.82rem' } }}>
                    {move.label}
                </Typography>
                {annotated && <ChatBubbleOutline sx={{ fontSize: 13, color: 'rgba(0,186,255,0.7)' }} />}
            </SeekRow>
        </Box>
    );
});

/** The move list, rendered inline as a panel tab body. Click a row to seek; the current
 *  move is highlighted and follows the playhead into view; annotated moves show a chat
 *  marker. The follow moves only the panel's own scroller (`followIntoView`), never the
 *  document, and snaps rather than animates while autoplay is running. */
const MovesTab: React.FC = () => {
    const { moves, currentMoveIndex, seekToBeatOf, isPlaying } = useReplay();
    const { hasNotes } = useReplayAnnotations();

    useEffect(() => {
        const panel = document.getElementById('replay-tabpanel');
        followIntoView(panel?.querySelector(`[data-move-index="${currentMoveIndex}"]`), !isPlaying);
    }, [currentMoveIndex, isPlaying]);

    return (
        <Box sx={{ py: 0.5 }}>
            {moves.length === 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', px: 1.5 }}>No moves recorded.</Typography>
            )}
            {moves.map((move, i) => (
                <MoveRow
                    key={move.seq}
                    move={move}
                    index={i}
                    isCurrent={i === currentMoveIndex}
                    annotated={hasNotes(move.seq)}
                    onSeek={seekToBeatOf}
                />
            ))}
        </Box>
    );
};

export default MovesTab;
