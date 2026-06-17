'use client';
import React, { useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { turnDigests } from '@/app/_utils/turnDigests';
import type { Bookmark } from '@/app/_utils/replayDecisions';

const fmtTarget = (tgt?: string) => {
    if (!tgt) return '';
    const m = /^base@(\d)$/.exec(tgt);
    return m ? `P${m[1]} base` : tgt;
};

const TurnDigests: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const { doc, nameOf, seekToSeq, header } = useReplay();
    const digests = useMemo(() => turnDigests(doc), [doc]);

    const markLabel = (b: Bookmark): string => {
        switch (b.kind) {
            case 'BIG_DAMAGE': return `${nameOf(b.src ?? '')} hits ${fmtTarget(b.tgt)} for ${b.amt}`;
            case 'DEFEAT': return `${nameOf(b.card ?? '')} defeated`;
            case 'OVERWHELM': return `Overwhelm ${fmtTarget(b.tgt)} for ${b.amt}`;
            case 'INITIATIVE': return `P${b.p} claimed initiative`;
            case 'GAME_END': return `Game end${b.reason ? ` — ${b.reason}` : ''}`;
            default: return b.kind;
        }
    };

    const p1 = header.p1 || 'Player 1';
    const p2 = header.p2 || 'Player 2';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { backgroundColor: 'rgba(12,15,22,0.97)', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.12)' } }}
        >
            <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Turn-by-turn digest
                <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
                {digests.map((d) => (
                    <Box key={d.round} sx={{ mb: 2 }}>
                        <Typography
                            variant="subtitle2"
                            onClick={() => { if (d.seq) { seekToSeq(d.seq); onClose(); } }}
                            sx={{
                                color: 'white', fontWeight: 700, cursor: d.seq ? 'pointer' : 'default',
                                borderBottom: '1px solid rgba(255,255,255,0.12)', pb: 0.5, mb: 0.75,
                                '&:hover': { color: d.seq ? 'var(--initiative-blue)' : 'white' },
                            }}
                        >
                            {d.round === 0 ? 'Setup' : `Round ${d.round}`}
                        </Typography>
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
                            <Typography
                                key={`${b.seq}-${i}`}
                                variant="caption"
                                onClick={() => { seekToSeq(b.seq); onClose(); }}
                                sx={{ color: '#ffc857', display: 'block', cursor: 'pointer', ml: 1, '&:hover': { textDecoration: 'underline' } }}
                            >
                                ★ {markLabel(b)}
                            </Typography>
                        ))}
                    </Box>
                ))}
                {digests.length === 0 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>No rounds recorded.</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default TurnDigests;
