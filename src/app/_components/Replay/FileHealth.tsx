'use client';
import React, { useMemo, useState } from 'react';
import { Box, Typography, Tooltip, Collapse } from '@mui/material';
import { WarningAmberOutlined, CheckCircleOutlined, ExpandMore } from '@mui/icons-material';
import { checkKeyframes } from '@/lib/swupgn';
import SeekRow from './SeekRow';
import { fileIssues, writerGeneration } from '@/app/_utils/swupgnFileIssues';
import { useReplay } from '@/app/_contexts/Replay.context';

/**
 * Does the file agree with itself?
 *
 * Every keyframe is an independent snapshot the writer took, so folding the events forward
 * has to arrive at the same board. Where it doesn't, the file is telling two stories, and
 * the viewer is showing one of them. That gate has existed in the reader since the format
 * shipped and was never surfaced — the pilot-in-the-wrong-arena bug reported 6 mismatches
 * from the moment the file loaded, and nobody could see them.
 *
 * Checked against the RAW events, not the repaired stream: the point is to report what the
 * writer emitted, including the defects this reader works around.
 *
 * Alongside the keyframe gate, the spec asks a reader to SURFACE a few things it accepts
 * (§5.3 provenance sentinels, §10.1/§6.2 non-conformant records, §13 partial keyframes, §18
 * unknown event types). Those come from fileIssues(); an info-level note (a Perspective
 * file) is shown but does not turn the badge amber.
 */
const MAX_LISTED = 40;
const MONO = { color: 'rgba(255,255,255,0.65)', display: 'block', fontFamily: 'monospace', fontSize: '0.68rem' } as const;
const fmt = (v: unknown) => (v === undefined ? '—' : typeof v === 'string' ? v : JSON.stringify(v));

const FileHealth: React.FC = () => {
    const { doc } = useReplay();
    const [open, setOpen] = useState(false);
    const result = useMemo(() => checkKeyframes(doc.events), [doc]);
    const issues = useMemo(() => fileIssues(doc), [doc]);
    const generation = useMemo(() => writerGeneration(doc), [doc]);
    const warnings = issues.filter((i) => i.severity === 'warning');
    const infos = issues.filter((i) => i.severity === 'info');
    // A damaged keyframe (§13) is reported by the gate as one `keyframe` mismatch; every other
    // mismatch is a field the events and the snapshot disagree on (§14).
    const damaged = result.mismatches.filter((m) => m.path === 'keyframe');
    const mismatches = result.mismatches.filter((m) => m.path !== 'keyframe');
    const notes = [...infos.map((i) => i.message), ...generation];

    const consistent = result.ok && warnings.length === 0;
    if (consistent && notes.length === 0) {
        return (
            <Tooltip title="Every keyframe agrees with the folded events (§14), and the file follows the current writer">
                {/* Focusable so the tooltip opens from the keyboard. */}
                <Box tabIndex={0} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(120,220,150,0.75)', '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: 2 } }}>
                    <CheckCircleOutlined sx={{ fontSize: 15 }} />
                    <Typography variant="caption">File consistent</Typography>
                </Box>
            </Tooltip>
        );
    }

    // Group by field, because one writer defect produces one mismatch per keyframe and a
    // flat list of 14 reads like 14 problems; the full list follows for anyone chasing one.
    const byPath = new Map<string, number>();
    for (const m of mismatches) {
        const key = m.path.replace(/\[.*\]/, '[…]');
        byPath.set(key, (byPath.get(key) ?? 0) + 1);
    }

    // A consistent file from an earlier writer is still green; its notes say what the replay
    // cannot show, and open like the problems do.
    const badge = consistent
        ? `File consistent · ${notes.length === 1 ? '1 note' : `${notes.length} notes`}`
        : [
            mismatches.length > 0 ? `${mismatches.length} keyframe mismatch${mismatches.length === 1 ? '' : 'es'}` : '',
            damaged.length > 0 ? `${damaged.length} damaged keyframe${damaged.length === 1 ? '' : 's'}` : '',
            warnings.length > 0 ? `${warnings.length} format issue${warnings.length === 1 ? '' : 's'}` : '',
        ].filter(Boolean).join(' · ');
    const color = consistent ? 'rgba(120,220,150,0.75)' : 'rgba(255,200,87,0.9)';
    const Icon = consistent ? CheckCircleOutlined : WarningAmberOutlined;

    return (
        <Box>
            <SeekRow
                onClick={() => setOpen((o) => !o)}
                expanded={open}
                label={`${badge}. Show details`}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    color,
                    '&:hover': { filter: 'brightness(1.15)' },
                    '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: 2 },
                }}
            >
                <Icon sx={{ fontSize: 15 }} />
                <Typography variant="caption" sx={{ flex: 1 }}>{badge}</Typography>
                <ExpandMore sx={{ fontSize: 16, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }} />
            </SeekRow>
            <Collapse in={open}>
                {mismatches.length > 0 && (
                    <>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                            The writer&apos;s own snapshots disagree with its own event stream (§14): the
                            deltas between two keyframes are under-recorded. The board follows the events
                            and resyncs at every keyframe. Fields affected:
                        </Typography>
                        {[...byPath].map(([path, n]) => (
                            <Typography key={path} variant="caption" sx={MONO}>{path} ×{n}</Typography>
                        ))}
                        <Box component="ul" aria-label="Keyframe mismatches" sx={{ m: 0, mt: 0.5, pl: 1.5, maxHeight: 160, overflowY: 'auto' }}>
                            {mismatches.slice(0, MAX_LISTED).map((m, i) => (
                                <Typography key={`${m.seq}-${m.path}-${i}`} component="li" variant="caption" sx={MONO}>
                                    {m.seq} {m.path}: expected {fmt(m.expected)}, got {fmt(m.got)}
                                </Typography>
                            ))}
                            {mismatches.length > MAX_LISTED && (
                                <Typography component="li" variant="caption" sx={MONO}>… and {mismatches.length - MAX_LISTED} more</Typography>
                            )}
                        </Box>
                    </>
                )}
                {damaged.length > 0 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', mt: 0.5 }}>
                        {damaged.length === 1 ? 'A keyframe' : `${damaged.length} keyframes`} ({damaged.map((m) => m.seq).join(', ')}) missing a seat or malformed: ignored, the board keeps folding through it and that round boundary is not verified (§13).
                    </Typography>
                )}
                {issues.map((i) => (
                    <Typography key={i.message} variant="caption" sx={{ color: i.severity === 'warning' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.45)', display: 'block', mt: 0.5 }}>
                        {i.message}
                    </Typography>
                ))}
                {generation.length > 0 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 1 }}>
                        Written by an earlier 1.0 writer (§22):
                    </Typography>
                )}
                {generation.map((g) => (
                    <Typography key={g} variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', display: 'block', mt: 0.5 }}>
                        {g}
                    </Typography>
                ))}
            </Collapse>
        </Box>
    );
};

export default FileHealth;
