'use client';
import React, { useMemo, useState } from 'react';
import { Box, Typography, Tooltip, Collapse } from '@mui/material';
import { WarningAmberOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { checkKeyframes } from '@/lib/swupgn';
import { fileIssues } from '@/app/_utils/swupgnFileIssues';
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
const FileHealth: React.FC = () => {
    const { doc } = useReplay();
    const [open, setOpen] = useState(false);
    const result = useMemo(() => checkKeyframes(doc.events), [doc]);
    const issues = useMemo(() => fileIssues(doc), [doc]);
    const warnings = issues.filter((i) => i.severity === 'warning');
    const infos = issues.filter((i) => i.severity === 'info');

    if (result.ok && warnings.length === 0) {
        if (infos.length > 0) {
            return (
                <Tooltip title={infos.map((i) => i.message).join(' ')}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(120,220,150,0.75)' }}>
                        <CheckCircleOutlined sx={{ fontSize: 15 }} />
                        <Typography variant="caption">File consistent · {infos.length === 1 ? infos[0].message.split(':')[0] : `${infos.length} notes`}</Typography>
                    </Box>
                </Tooltip>
            );
        }
        return (
            <Tooltip title="Every keyframe agrees with the folded events">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'rgba(120,220,150,0.75)' }}>
                    <CheckCircleOutlined sx={{ fontSize: 15 }} />
                    <Typography variant="caption">File consistent</Typography>
                </Box>
            </Tooltip>
        );
    }

    // Group by field, because one writer defect produces one mismatch per keyframe and a
    // flat list of 14 reads like 14 problems.
    const byPath = new Map<string, number>();
    for (const m of result.mismatches) {
        const key = m.path.replace(/\[.*\]/, '[…]');
        byPath.set(key, (byPath.get(key) ?? 0) + 1);
    }

    const badge = [
        result.mismatches.length > 0 ? `${result.mismatches.length} keyframe mismatch${result.mismatches.length === 1 ? '' : 'es'}` : '',
        warnings.length > 0 ? `${warnings.length} format issue${warnings.length === 1 ? '' : 's'}` : '',
    ].filter(Boolean).join(' · ');

    return (
        <Box>
            <Box
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-label={`${badge}. Show details`}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
                    color: 'rgba(255,200,87,0.9)',
                    '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: 2 },
                }}
            >
                <WarningAmberOutlined sx={{ fontSize: 15 }} />
                <Typography variant="caption">{badge}</Typography>
            </Box>
            <Collapse in={open}>
                {result.mismatches.length > 0 && (
                    <>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                            The writer&apos;s own snapshots disagree with its own event stream. The board
                            below follows the events. Fields affected:
                        </Typography>
                        {[...byPath].map(([path, n]) => (
                            <Typography key={path} variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                                {path} ×{n}
                            </Typography>
                        ))}
                    </>
                )}
                {issues.map((i) => (
                    <Typography key={i.message} variant="caption" sx={{ color: i.severity === 'warning' ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.45)', display: 'block', mt: 0.5 }}>
                        {i.message}
                    </Typography>
                ))}
            </Collapse>
        </Box>
    );
};

export default FileHealth;
