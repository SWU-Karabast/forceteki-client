'use client';
import React, { useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton, Box, Typography, Tooltip,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useCardCostMap } from '@/app/_utils/swupgnCardCosts';
import { resourcingReport, type PlayerRoundResourcing } from '@/app/_utils/resourcingReport';
import type { Seat } from '@/lib/swupgn';

const fmtPct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const fmtNum = (v: number | null) => (v == null ? '—' : String(v));

const RoundTable: React.FC<{ rows: PlayerRoundResourcing[]; onSeek: (round: number) => void }> = ({ rows, onSeek }) => (
    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <Box component="thead">
            <Box component="tr" sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
                {['Rnd', 'Res', 'Play', 'Draw', 'Pool', 'Spent', 'Float'].map((h) => (
                    <Box component="th" key={h} sx={{ py: 0.5, px: 0.75, fontWeight: 600, textAlign: h === 'Rnd' ? 'left' : 'right' }}>{h}</Box>
                ))}
            </Box>
        </Box>
        <Box component="tbody">
            {rows.map((r) => (
                <Box
                    component="tr"
                    key={r.round}
                    onClick={() => onSeek(r.round)}
                    sx={{
                        cursor: 'pointer', color: 'rgba(255,255,255,0.85)',
                        backgroundColor: r.underspent ? 'rgba(255,107,107,0.14)' : 'transparent',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
                    }}
                >
                    <Box component="td" sx={{ py: 0.5, px: 0.75, fontWeight: 700 }}>{r.round}</Box>
                    <Box component="td" sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>{r.resourced}</Box>
                    <Box component="td" sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>{r.played}</Box>
                    <Box component="td" sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>{r.drawn}</Box>
                    <Box component="td" sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>{fmtNum(r.pool)}</Box>
                    <Box component="td" sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>{fmtNum(r.spent)}</Box>
                    <Tooltip title={r.underspent ? 'Left resources unspent' : ''}>
                        <Box component="td" sx={{ py: 0.5, px: 0.75, textAlign: 'right', fontWeight: r.underspent ? 800 : 400 }}>{fmtNum(r.float)}</Box>
                    </Tooltip>
                </Box>
            ))}
        </Box>
    </Box>
);

const PlayerColumn: React.FC<{ seat: Seat; name: string }> = ({ seat, name }) => {
    const { doc, nameOf, seekToSeq } = useReplay();
    const costMap = useCardCostMap();
    const report = useMemo(() => resourcingReport(doc, costMap), [doc, costMap]);

    const rows = report.byRound.filter((b) => b.seat === seat);
    const s = report.summary[seat];
    const roundStartSeq = useMemo(() => {
        const m: Record<number, string> = {};
        for (const e of doc.events) if (e.t === 'ROUND_START') m[e.round] = e.seq;
        return m;
    }, [doc.events]);
    const onSeek = (round: number) => { const seq = roundStartSeq[round]; if (seq) seekToSeq(seq); };

    return (
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>{name}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                <Stat label="Resourced" value={s.totalResourced} />
                <Stat label="Played" value={s.totalPlayed} />
                <Stat label="Drawn" value={s.totalDrawn} />
                <Stat label="Spent" value={s.totalSpent} />
                <Stat label="Avg eff." value={fmtPct(s.avgEfficiency)} />
            </Box>
            <RoundTable rows={rows} onSeek={onSeek} />
            <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                    Drawn, never played: {s.drawnNeverPlayed.length}
                    {s.resourcedFromHand > 0 && ` (${s.resourcedFromHand} resourced)`}
                </Typography>
                {s.drawnNeverPlayed.length > 0 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', mt: 0.5 }}>
                        {[...new Set(s.drawnNeverPlayed.map((id) => nameOf(id)))].join(', ')}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <Box>
        <Typography variant="h6" sx={{ color: 'var(--initiative-blue)', fontWeight: 700, lineHeight: 1 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{label}</Typography>
    </Box>
);

const ResourcingReport: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const { doc } = useReplay();
    const costMap = useCardCostMap();
    const hasCost = useMemo(() => resourcingReport(doc, costMap).hasCostData, [doc, costMap]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { backgroundColor: 'rgba(12,15,22,0.97)', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.12)' } }}
        >
            <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Resourcing report
                <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}><Close /></IconButton>
            </DialogTitle>
            <DialogContent>
                {!hasCost && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,200,87,0.9)', display: 'block', mb: 1.5 }}>
                        No card cost data resolved for this game — showing resourcing tempo only (spend/float unavailable).
                    </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 3 }}>
                    <PlayerColumn seat={1} name={doc.header.p1 || 'Player 1'} />
                    <PlayerColumn seat={2} name={doc.header.p2 || 'Player 2'} />
                </Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mt: 2 }}>
                    Red rows left ≥2 resources unspent. Click a row to jump to that round.
                </Typography>
            </DialogContent>
        </Dialog>
    );
};

export default ResourcingReport;
