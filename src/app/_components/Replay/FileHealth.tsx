'use client';
import React, { useMemo, useState } from 'react';
import { Box, Typography, Tooltip, Collapse } from '@mui/material';
import { WarningAmberOutlined, CheckCircleOutlined } from '@mui/icons-material';
import { checkKeyframes } from '@/lib/swupgn';
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
 */
const FileHealth: React.FC = () => {
    const { doc } = useReplay();
    const [open, setOpen] = useState(false);
    const result = useMemo(() => checkKeyframes(doc.events), [doc]);

    if (result.ok) {
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

    return (
        <Box>
            <Box
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-label={`${result.mismatches.length} keyframe mismatches. Show details`}
                onClick={() => setOpen((o) => !o)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((o) => !o); } }}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
                    color: 'rgba(255,200,87,0.9)',
                    '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: 2 },
                }}
            >
                <WarningAmberOutlined sx={{ fontSize: 15 }} />
                <Typography variant="caption">
                    {result.mismatches.length} keyframe mismatch{result.mismatches.length === 1 ? '' : 'es'}
                </Typography>
            </Box>
            <Collapse in={open}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                    The writer&apos;s own snapshots disagree with its own event stream. The board
                    below follows the events. Fields affected:
                </Typography>
                {[...byPath].map(([path, n]) => (
                    <Typography key={path} variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block', fontFamily: 'monospace', fontSize: '0.68rem' }}>
                        {path} ×{n}
                    </Typography>
                ))}
            </Collapse>
        </Box>
    );
};

export default FileHealth;
