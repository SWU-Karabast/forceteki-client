'use client';
import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { turnDigests } from '@/app/_utils/turnDigests';
import { bookmarkLabel } from '@/app/_utils/replayDecisions';
import SeekRow from './SeekRow';
import { displayText } from '@/lib/swupgn';

/** Turn-by-turn digest, rendered inline as a panel tab body. */
const TurnDigests: React.FC = () => {
    const { doc, nameAtSeq, seekToSeq, header } = useReplay();
    const digests = useMemo(() => turnDigests(doc), [doc]);

    const p1 = displayText(header.p1) || 'Player 1';
    const p2 = displayText(header.p2) || 'Player 2';

    return (
        <Box sx={styles.container}>
            {digests.map((d) => (
                <Box key={d.round} sx={styles.round}>
                    <SeekRow
                        onClick={() => { if (d.seq) seekToSeq(d.seq); }}
                        disabled={!d.seq}
                        sx={styles.roundHeader(!!d.seq)}
                    >
                        <Typography variant="subtitle2" sx={styles.roundTitle}>
                            {d.round === 0 ? 'Setup' : `Round ${d.round}`}
                        </Typography>
                    </SeekRow>
                    {([1, 2] as const).map((seat) => {
                        const row = d.perSeat[seat];
                        if (!row) return null;
                        return (
                            <Typography key={seat} variant="body2" sx={styles.seatLine}>
                                <Box component="span" sx={styles.seatName}>{seat === 1 ? p1 : p2}</Box>
                                {`: resourced ${row.resourced}, played ${row.played}, drawn ${row.drawn}`}
                                {row.paid != null ? `, paid ${row.paid}` : row.spent != null ? `, cost ${row.spent}` : ''}
                            </Typography>
                        );
                    })}
                    {d.bookmarks.map((b, i) => {
                        const rowKey = `${b.seq}-${i}`;
                        return (
                            <SeekRow
                                key={rowKey}
                                onClick={() => seekToSeq(b.seq)}
                                sx={styles.bookmark}
                            >
                                <Typography variant="caption" sx={styles.bookmarkText}>
                                    ★ {bookmarkLabel(b, (id) => nameAtSeq(id, b.seq))}
                                </Typography>
                            </SeekRow>
                        );
                    })}
                </Box>
            ))}
            {digests.length === 0 && (
                <Typography variant="caption" sx={styles.empty}>No rounds recorded.</Typography>
            )}
        </Box>
    );
};

export default TurnDigests;

// ----------------Styles----------------//
const styles = {
    container: {
        p: 1.5,
    },
    round: {
        mb: 2,
    },
    roundHeader: (seekable: boolean) => ({
        color: 'white',
        borderBottom: '1px solid rgba(255,255,255,0.12)', pb: 0.5, mb: 0.75,
        '&:hover': { color: seekable ? 'var(--initiative-blue)' : 'white' },
    }),
    roundTitle: {
        color: 'inherit',
        fontWeight: 700,
    },
    seatLine: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: '0.82rem',
    },
    seatName: {
        color: 'var(--initiative-blue)',
        fontWeight: 700,
    },
    bookmark: {
        ml: 1,
        '&:hover': { textDecoration: 'underline' },
    },
    bookmarkText: {
        color: '#ffc857',
        display: 'block',
    },
    empty: {
        color: 'rgba(255,255,255,0.4)',
    },
};
