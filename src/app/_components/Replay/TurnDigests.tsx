'use client';
import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { turnDigests } from '@/app/_utils/turnDigests';
import { bookmarkLabel } from '@/app/_utils/replayDecisions';
import SeekRow from './SeekRow';

/** Turn-by-turn digest, rendered inline as a panel tab body. */
const TurnDigests: React.FC = () => {
    const { doc, nameOf, seekToSeq, header } = useReplay();
    const digests = useMemo(() => turnDigests(doc), [doc]);

    const p1 = header.p1 || 'Player 1';
    const p2 = header.p2 || 'Player 2';

    return (
        <Box sx={{ p: 1.5 }}>
            {digests.map((d) => (
                <Box key={d.round} sx={{ mb: 2 }}>
                    <SeekRow
                        onClick={() => { if (d.seq) seekToSeq(d.seq); }}
                        disabled={!d.seq}
                        sx={{
                            color: 'white',
                            borderBottom: '1px solid rgba(255,255,255,0.12)', pb: 0.5, mb: 0.75,
                            '&:hover': { color: d.seq ? 'var(--initiative-blue)' : 'white' },
                        }}
                    >
                        <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 700 }}>
                            {d.round === 0 ? 'Setup' : `Round ${d.round}`}
                        </Typography>
                    </SeekRow>
                    {([1, 2] as const).map((seat) => {
                        const row = d.perSeat[seat];
                        if (!row) return null;
                        return (
                            <Typography key={seat} variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem' }}>
                                <Box component="span" sx={{ color: 'var(--initiative-blue)', fontWeight: 700 }}>{seat === 1 ? p1 : p2}</Box>
                                {`: resourced ${row.resourced}, played ${row.played}, drawn ${row.drawn}`}
                                {row.spent != null && `, spent ${row.spent}`}
                            </Typography>
                        );
                    })}
                    {d.bookmarks.map((b, i) => (
                        <SeekRow
                            key={`${b.seq}-${i}`}
                            onClick={() => seekToSeq(b.seq)}
                            sx={{ ml: 1, '&:hover': { textDecoration: 'underline' } }}
                        >
                            <Typography variant="caption" sx={{ color: '#ffc857', display: 'block' }}>
                                ★ {bookmarkLabel(b, nameOf)}
                            </Typography>
                        </SeekRow>
                    ))}
                </Box>
            ))}
            {digests.length === 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>No rounds recorded.</Typography>
            )}
        </Box>
    );
};

export default TurnDigests;
