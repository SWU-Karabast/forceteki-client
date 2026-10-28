'use client';
import React, { useMemo } from 'react';
import { Box, Typography, Tooltip, ButtonBase } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useCardCostMap } from '@/app/_utils/swupgnCardCosts';
import { resourcingReport } from '@/app/_utils/resourcingReport';
import { displayText } from '@/lib/swupgn';
import type { IDecisionListProps, IPlayerColumnProps, IRoundTableProps, IStatProps } from './ReplayTypes';

const fmtPct = (v: number | null) => (v == null ? '—' : `${Math.round(v * 100)}%`);
const fmtNum = (v: number | null) => (v == null ? '—' : String(v));

/**
 * `Paid` is the file's own count of resources exhausted (EXHAUST_RESOURCES, spec §10.1). A file
 * written before that record existed only carries each play's PRINTED cost, which is not what
 * was paid once an aspect penalty or a discount applied: that column is labelled `Cost*`.
 */
const RoundTable: React.FC<IRoundTableProps> = ({ rows, paid, onSeek }) => (
    // The scroller is a safety net: at the panel's narrowest a 7-column table can still
    // outgrow its column, and it should scroll rather than crush its cells.
    <Box sx={styles.tableScroller}>
        <Box component="table" sx={styles.table}>
            <Box component="thead">
                <Box component="tr" sx={styles.headRow}>
                    {['Rnd', 'Res', 'Play', 'Draw', 'Pool', paid ? 'Paid' : 'Cost*', 'Float'].map((h) => (
                        <Box component="th" key={h} sx={styles.headCell(h === 'Rnd')}>{h}</Box>
                    ))}
                </Box>
            </Box>
            <Box component="tbody">
                {rows.map((r) => (
                    <Box
                        component="tr"
                        key={r.round}
                        onClick={() => onSeek(r.round)}
                        sx={styles.bodyRow(r.underspent)}
                    >
                        {/* The row stays a real table row so a screen reader keeps its columns;
                            the keyboard and assistive-tech route to the seek is this cell's
                            button. The row's own click is a wider target for the mouse. */}
                        <Box component="td" sx={styles.roundCell}>
                            <ButtonBase
                                aria-label={`Jump to round ${r.round}`}
                                onClick={(e) => { e.stopPropagation(); onSeek(r.round); }}
                                sx={styles.roundButton}
                            >
                                {r.round}
                            </ButtonBase>
                        </Box>
                        <Box component="td" sx={styles.cell}>{r.resourced}</Box>
                        <Box component="td" sx={styles.cell}>{r.played}</Box>
                        <Box component="td" sx={styles.cell}>{r.drawn}</Box>
                        <Box component="td" sx={styles.cell}>{fmtNum(r.pool)}</Box>
                        <Tooltip title={paid && r.spent != null ? `Printed cost of the cards played: ${r.spent}` : ''}>
                            <Box component="td" sx={styles.cell}>{fmtNum(paid ? r.paid : r.spent)}</Box>
                        </Tooltip>
                        <Tooltip title={r.underspent ? 'Left resources unspent' : ''}>
                            <Box component="td" sx={styles.floatCell(r.underspent)}>{fmtNum(r.float)}</Box>
                        </Tooltip>
                    </Box>
                ))}
            </Box>
        </Box>
    </Box>
);

/**
 * The resource commitments themselves: what was taken, and what was passed over. The board
 * can only ever show the hand AFTER a pick, so the alternatives — the actual substance of
 * the decision — are invisible while scrubbing. Click a row to jump to that moment.
 */
const DecisionList: React.FC<IDecisionListProps> = ({ seat }) => {
    const { resourcingDecisions, nameOf, seekTo, currentIndex } = useReplay();
    const mine = resourcingDecisions.filter((d) => d.seat === seat);
    if (mine.length === 0) return null;

    return (
        <Box sx={styles.picks}>
            <Typography variant="caption" sx={styles.picksHeading}>
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
                        sx={styles.pick(d.frame === currentIndex)}
                    >
                        <Typography variant="caption" sx={styles.pickCard}>
                            {d.round > 0 ? `R${d.round}` : 'Setup'} · {nameOf(d.card)}
                        </Typography>
                        <Typography variant="caption" sx={styles.pickPassed}>
                            {passed.length > 0 ? `over ${passed.map((id) => nameOf(id)).join(', ')}` : 'only card in hand'}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
};

const PlayerColumn: React.FC<IPlayerColumnProps> = ({ seat, name, report }) => {
    const { nameOf, chapterMarks, seekToBeat } = useReplay();

    const rows = report.byRound.filter((b) => b.seat === seat);
    const s = report.summary[seat];
    const onSeek = (round: number) => {
        const mark = chapterMarks.find((m) => m.kind === 'round' && m.label === `R${round}`);
        if (mark) seekToBeat(mark.value);
    };

    return (
        <Box sx={styles.column}>
            <Typography variant="subtitle2" sx={styles.columnName}>{name}</Typography>
            <Box sx={styles.stats}>
                <Stat label="Resourced" value={s.totalResourced} />
                <Stat label="Played" value={s.totalPlayed} />
                <Stat label="Drawn" value={s.totalDrawn} />
                <Stat label={report.hasPaidData ? 'Paid' : 'Cost*'} value={report.hasPaidData ? fmtNum(s.totalPaid) : s.totalSpent} />
                <Stat label="Avg eff." value={fmtPct(s.avgEfficiency)} />
            </Box>
            <RoundTable rows={rows} paid={report.hasPaidData} onSeek={onSeek} />
            <Box sx={styles.neverPlayed}>
                <Typography variant="caption" sx={styles.neverPlayedHeading}>
                    Drawn, never played: {s.drawnNeverPlayed.length}
                    {s.resourcedFromHand > 0 && ` (${s.resourcedFromHand} resourced)`}
                </Typography>
                {s.drawnNeverPlayed.length > 0 && (
                    <Typography variant="caption" sx={styles.neverPlayedList}>
                        {[...new Set(s.drawnNeverPlayed.map((id) => nameOf(id)))].join(', ')}
                    </Typography>
                )}
            </Box>
            <DecisionList seat={seat} />
        </Box>
    );
};

const Stat: React.FC<IStatProps> = ({ label, value }) => (
    <Box>
        <Typography variant="h6" sx={styles.statValue}>{value}</Typography>
        <Typography variant="caption" sx={styles.statLabel}>{label}</Typography>
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
        <Box sx={styles.container}>
            {!hasCost && !report.hasPaidData && (
                <Typography variant="caption" sx={styles.notice}>
                    No card cost data resolved for this game — showing resourcing tempo only (spend/float unavailable).
                </Typography>
            )}
            {!report.hasPaidData && hasCost && (
                <Typography variant="caption" sx={styles.notice}>
                    *Cost is each card&apos;s printed cost. This file predates the resource counters, so what was actually paid (after aspect penalties and discounts) is not recorded.
                </Typography>
            )}
            {/* Wraps to one column per row once two 260px tables no longer fit side by side. */}
            <Box sx={styles.columns}>
                <PlayerColumn seat={1} name={displayText(doc.header.p1) || 'Player 1'} report={report} />
                <PlayerColumn seat={2} name={displayText(doc.header.p2) || 'Player 2'} report={report} />
            </Box>
            <Typography variant="caption" sx={styles.footnote}>
                Red rows left ≥2 resources unspent{report.hasPaidData ? ' (by what was paid, not printed cost)' : ''}. Click a row to jump to that round.
            </Typography>
        </Box>
    );
};

export default ResourcingReport;

// ----------------Styles----------------//
const styles = {
    tableScroller: {
        overflowX: 'auto',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.78rem',
    },
    headRow: {
        color: 'rgba(255,255,255,0.5)',
        textAlign: 'right',
    },
    headCell: (isRound: boolean) => ({
        py: 0.5,
        px: 0.75,
        fontWeight: 600,
        textAlign: isRound ? 'left' : 'right',
    }),
    bodyRow: (underspent: boolean) => ({
        cursor: 'pointer', color: 'rgba(255,255,255,0.85)',
        backgroundColor: underspent ? 'rgba(255,107,107,0.14)' : 'transparent',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
    }),
    roundCell: {
        py: 0.5,
        px: 0.75,
        fontWeight: 700,
    },
    roundButton: {
        font: 'inherit', color: 'inherit', borderRadius: '2px',
        '&.Mui-focusVisible': { outline: '2px solid #fff', outlineOffset: 2 },
    },
    cell: {
        py: 0.5,
        px: 0.75,
        textAlign: 'right',
    },
    floatCell: (underspent: boolean) => ({
        py: 0.5,
        px: 0.75,
        textAlign: 'right',
        fontWeight: underspent ? 800 : 400,
    }),
    picks: {
        mt: 1.5,
    },
    picksHeading: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
        display: 'block',
        mb: 0.5,
    },
    pick: (isCurrent: boolean) => ({
        cursor: 'pointer', py: 0.5, px: 0.75, borderRadius: '4px',
        borderLeft: '2px solid',
        borderColor: isCurrent ? 'var(--selection-blue)' : 'transparent',
        backgroundColor: isCurrent ? 'rgba(255,255,255,0.08)' : 'transparent',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.06)' },
        '&:focus-visible': { outline: '2px solid #fff', outlineOffset: -2 },
    }),
    pickCard: {
        color: 'rgba(255,255,255,0.85)',
        display: 'block',
        fontWeight: 600,
    },
    pickPassed: {
        color: 'rgba(255,255,255,0.4)',
        display: 'block',
        lineHeight: 1.3,
    },
    column: {
        flex: 1,
        minWidth: 260,
    },
    columnName: {
        color: 'white',
        fontWeight: 700,
        mb: 1,
    },
    stats: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        mb: 1.5,
    },
    neverPlayed: {
        mt: 1.5,
    },
    neverPlayedHeading: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: 600,
    },
    neverPlayedList: {
        color: 'rgba(255,255,255,0.45)',
        display: 'block',
        mt: 0.5,
    },
    statValue: {
        color: 'var(--initiative-blue)',
        fontWeight: 700,
        lineHeight: 1,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.5)',
    },
    container: {
        p: 1.5,
    },
    notice: {
        color: 'rgba(255,200,87,0.9)',
        display: 'block',
        mb: 1.5,
    },
    columns: {
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
    },
    footnote: {
        color: 'rgba(255,255,255,0.35)',
        display: 'block',
        mt: 2,
    },
};
