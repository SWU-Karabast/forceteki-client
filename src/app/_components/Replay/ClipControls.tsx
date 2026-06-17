'use client';
import React, { useMemo, useState } from 'react';
import { Box, IconButton, Tooltip, Button, Typography, Snackbar, CircularProgress } from '@mui/material';
import { ContentCut, FirstPage, LastPage, LinkOutlined, Close, MovieCreationOutlined } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { downloadClipWebm } from '@/app/_utils/exportClipWebm';

/**
 * P4 clips (light): mark an in/out frame range and copy a deep-link that auto-plays just
 * that range (?id=X&from=N&to=M). Playback loops within an active clip.
 */
const ClipControls: React.FC = () => {
    const { clip, setClipStart, setClipEnd, clearClip, currentIndex, replayId, totalFrames, doc, moves, nameOf } = useReplay();
    const [open, setOpen] = useState(false);
    const [snack, setSnack] = useState('');
    const [recording, setRecording] = useState(false);

    const labelBySeq = useMemo(() => {
        const m = new Map<string, string>();
        for (const mv of moves) m.set(mv.seq, mv.label);
        return m;
    }, [moves]);

    if (totalFrames === 0) return null;

    const exportWebm = async () => {
        if (!clip || recording) return;
        setRecording(true);
        setSnack('Recording clip…');
        try {
            await downloadClipWebm({
                doc, start: clip.start, end: clip.end,
                labelForSeq: (seq) => labelBySeq.get(seq),
                nameOf,
            });
            setSnack('Clip saved (.webm)');
        } catch (err) {
            setSnack(err instanceof Error ? err.message : 'Clip export failed');
        } finally {
            setRecording(false);
        }
    };

    const copyClipLink = async () => {
        if (!clip) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        if (!replayId) { setSnack('Save the replay first (re-open from the library) to share a clip link'); return; }
        const url = `${origin}/Replay?id=${replayId}&from=${clip.start}&to=${clip.end}`;
        try {
            await navigator.clipboard.writeText(url);
            setSnack('Clip link copied — send the replay file too');
        } catch {
            setSnack('Could not copy link');
        }
    };

    const btnSx = { color: 'white', backgroundColor: 'rgba(0,0,0,0.6)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' } };

    if (!open) {
        return (
            <Tooltip title="Make a clip">
                <IconButton onClick={() => setOpen(true)} sx={{ position: 'fixed', bottom: 68, left: 12, zIndex: 1305, ...btnSx }}>
                    <ContentCut />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Box
            sx={{
                position: 'fixed', bottom: 68, left: 12, zIndex: 1305,
                display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5,
                backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)',
            }}
        >
            <Tooltip title="Set clip start to current frame">
                <IconButton size="small" onClick={setClipStart} sx={{ color: 'white' }}><FirstPage fontSize="small" /></IconButton>
            </Tooltip>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 56, textAlign: 'center' }}>
                {clip ? `${clip.start}–${clip.end}` : `· ${currentIndex} ·`}
            </Typography>
            <Tooltip title="Set clip end to current frame">
                <IconButton size="small" onClick={setClipEnd} sx={{ color: 'white' }}><LastPage fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Copy clip link">
                <span><IconButton size="small" onClick={copyClipLink} disabled={!clip} sx={{ color: 'var(--initiative-blue)' }}><LinkOutlined fontSize="small" /></IconButton></span>
            </Tooltip>
            <Tooltip title="Export clip as .webm video">
                <span><IconButton size="small" onClick={exportWebm} disabled={!clip || recording} sx={{ color: 'white' }}>
                    {recording ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <MovieCreationOutlined fontSize="small" />}
                </IconButton></span>
            </Tooltip>
            {clip && (
                <Button size="small" onClick={clearClip} sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 0 }}>Clear</Button>
            )}
            <Tooltip title="Close clip controls">
                <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}><Close fontSize="small" /></IconButton>
            </Tooltip>
            <Snackbar open={!!snack} autoHideDuration={2800} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} />
        </Box>
    );
};

export default ClipControls;
