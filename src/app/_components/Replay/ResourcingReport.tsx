'use client';
import React, { useMemo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useCardCostMap } from '@/app/_utils/swupgnCardCosts';
import { resourcingReport, type PlayerRoundResourcing, type ResourcingReport as ResourcingReportData } from '@/app/_utils/resourcingReport';
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
                    role="button"
                    tabIndex={0}
                    aria-label={`Jump to round ${r.round}`}
                    onClick={() => onSeek(r.round)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSeek(r.round); } }}
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

/**
 * The resource commitments themselves: what was taken, and what was passed over. The board
 * can only ever show the hand AFTER a pick, so the alternatives — the actual substance of
 * the decision — are invisible while scrubbing. Click a row to jump to that moment.
 */
const DecisionList: React.FC<{ seat: Seat }> = ({ seat }) => {
    const { resourcingDecisions, nameOf, seekTo, currentIndex } = useReplay();
    const mine = resourcingDecisions.filter((d) => d.seat === seat);
    if (mine.length === 0) return null;

    return (
        <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Resource picks
            </Typography>
            {mine.map((d) => {
                const passed = d.handBefore.filter((id) => id !== d.card);
                return (
                    <Box
                        key={d.seq}
                        role="button"
                        tabIndex={0}
                        aria-label={`Jump to ${d.round > 0 ? `round ${d.round}` : 'setup'} resource pick: ${nameOf(d.card)}`}
                        onClick={() => seekTo(d.frame)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seekTo(d.frame); } }}
                        sx={{
                            cursor: 'pointer', py: 0.5, px: 0.75, borderRadius: '4px',
                            borderLeft: '2px solid',
                            borderColor: d.frame === currentIndex ? 'var(--selection-blue)' : 'transparent',
                            backgroundColor: d.frame === currentIndex ? 'rgba(255,255,255,0.08)' : 'transparent',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
                        }}
                    >
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', fontWeight: 600 }}>
                            {d.round > 0 ? `R${d.round}` : 'Setup'} · {nameOf(d.card)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', lineHeight: 1.3 }}>
                            {passed.length > 0 ? `over ${passed.map((id) => nameOf(id)).join(', ')}` : 'only card in hand'}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

const PlayerColumn: React.FC<{ seat: Seat; name: string; report: ResourcingReportData }> = ({ seat, name, report }) => {
    const { nameOf, roundMarks, seekTo } = useReplay();

    const rows = report.byRound.filter((b) => b.seat === seat);
    const s = report.summary[seat];
    const onSeek = (round: number) => {
        const mark = roundMarks.find((m) => m.label === `R${round}`);
        if (mark) seekTo(mark.value);
    };

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
            <DecisionList seat={seat} />
        </Box>
    );
};

const Stat: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <Box>
        <Typography variant="h6" sx={{ color: 'var(--initiative-blue)', fontWeight: 700, lineHeight: 1 }}>{value}</Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{label}</Typography>
    </Box>
);

/** Resourcing report, rendered inline as a panel tab body. */
const ResourcingReport: React.FC = () => {
    const { doc } = useReplay();
    const costMap = useCardCostMap();
    // Compute the report once and share it across both player columns and the
    // cost-data notice, instead of recomputing the full O(events) pass 3x per render.
    const report = useMemo(() => resourcingReport(doc, costMap), [doc, costMap]);
    const hasCost = report.hasCostData;

    return (
        <Box sx={{ p: 1.5 }}>
            {!hasCost && (
                <Typography variant="caption" sx={{ color: 'rgba(255,200,87,0.9)', display: 'block', mb: 1.5 }}>
                    No card cost data resolved for this game — showing resourcing tempo only (spend/float unavailable).
                </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 3 }}>
                <PlayerColumn seat={1} name={doc.header.p1 || 'Player 1'} report={report} />
                <PlayerColumn seat={2} name={doc.header.p2 || 'Player 2'} report={report} />
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mt: 2 }}>
                Red rows left ≥2 resources unspent. Click a row to jump to that round.
            </Typography>
        </Box>
    );
};

export default ResourcingReport;
