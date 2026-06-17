'use client';
import React, { useMemo, useState } from 'react';
import { Box, IconButton, Typography, Tooltip, TextField, Button } from '@mui/material';
import {
    RateReviewOutlined, ChevronLeft, SkipPrevious, SkipNext, DeleteOutline,
} from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useReplayAnnotations } from '@/app/_contexts/ReplayAnnotations.context';
import { NAG_ORDER, nagInfo, NAG_TONE_COLOR } from '@/app/_utils/nagGlyphs';
import { nextTag, prevTag } from '@/app/_utils/annotationNav';
import type { WorkingAnnotation } from '@/app/_utils/replayAnnotations';
import AnnotationBadge from './AnnotationBadge';

const ReviewPanel: React.FC = () => {
    const { doc, currentIndex, totalFrames, seekTo } = useReplay();
    const {
        threadFor, annotatedRefs, addAnnotation, deleteAnnotation, working, author, setAuthor,
    } = useReplayAnnotations();
    const [open, setOpen] = useState(false);
    const [draftNag, setDraftNag] = useState<string>('');
    const [draftText, setDraftText] = useState('');

    const eventSeqs = useMemo(() => doc.events.map((e) => e.seq), [doc.events]);
    const currentSeq = doc.events[currentIndex]?.seq ?? '';
    const thread = currentSeq ? threadFor(currentSeq) : [];
    const workingIds = useMemo(() => new Set(working.map((w) => w._id)), [working]);

    if (totalFrames === 0) return null;

    const goPrev = () => {
        const i = prevTag(eventSeqs, annotatedRefs, currentIndex);
        if (i !== null) seekTo(i);
    };
    const goNext = () => {
        const i = nextTag(eventSeqs, annotatedRefs, currentIndex);
        if (i !== null) seekTo(i);
    };

    const submit = () => {
        if (!draftNag && !draftText.trim()) return;
        addAnnotation(currentSeq, { nag: draftNag || undefined, text: draftText.trim() || undefined });
        setDraftNag('');
        setDraftText('');
    };

    if (!open) {
        return (
            <Tooltip title="Review & annotate">
                <IconButton
                    onClick={() => setOpen(true)}
                    sx={{
                        position: 'fixed', top: 76, left: 64, zIndex: 1305,
                        color: 'white', backgroundColor: 'rgba(0,0,0,0.6)',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
                    }}
                >
                    <RateReviewOutlined />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <Box
            sx={{
                position: 'fixed', top: 68, left: 0, bottom: 60,
                width: { xs: '80vw', sm: 330 },
                backgroundColor: 'rgba(0,0,0,0.82)',
                backdropFilter: 'blur(10px)',
                borderRight: '1px solid rgba(255,255,255,0.12)',
                zIndex: 1305,
                display: 'flex', flexDirection: 'column',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, letterSpacing: '0.04em' }}>
                    REVIEW
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Previous note">
                        <span><IconButton size="small" onClick={goPrev} disabled={prevTag(eventSeqs, annotatedRefs, currentIndex) === null} sx={{ color: 'rgba(255,255,255,0.7)' }}><SkipPrevious fontSize="small" /></IconButton></span>
                    </Tooltip>
                    <Tooltip title="Next note">
                        <span><IconButton size="small" onClick={goNext} disabled={nextTag(eventSeqs, annotatedRefs, currentIndex) === null} sx={{ color: 'rgba(255,255,255,0.7)' }}><SkipNext fontSize="small" /></IconButton></span>
                    </Tooltip>
                    <Tooltip title="Hide review panel">
                        <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}><ChevronLeft /></IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {/* Your name → annotation author */}
                <TextField
                    label="Your name"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    size="small"
                    variant="outlined"
                    fullWidth
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                    inputProps={{ style: { color: 'white' } }}
                    sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
                />

                {/* Notes on the current frame */}
                <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>
                        This frame {currentSeq && `(${currentSeq})`}
                    </Typography>
                    {thread.length === 0 && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>No notes here yet.</Typography>
                    )}
                    {thread.map((a, i) => {
                        // Working notes retain their client _id at runtime; file notes don't.
                        const id = (a as Partial<WorkingAnnotation>)._id;
                        const editable = !!id && workingIds.has(id);
                        return (
                            <Box key={id ?? `${a.ref}-${i}`} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5, borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.07)' }}>
                                <Box sx={{ pt: 0.25 }}><AnnotationBadge nag={a.nag} /></Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    {a.text && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{a.text}</Typography>}
                                    {a.by && <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>— {a.by}</Typography>}
                                </Box>
                                {editable && (
                                    <Tooltip title="Delete note">
                                        <IconButton size="small" onClick={() => deleteAnnotation(id!)} sx={{ color: 'rgba(255,255,255,0.4)' }}><DeleteOutline fontSize="small" /></IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        );
                    })}
                </Box>

                {/* Add a note to the current frame */}
                <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mb: 0.5 }}>Add note</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                        {NAG_ORDER.map((g) => {
                            const info = nagInfo(g)!;
                            const selected = draftNag === g;
                            return (
                                <Tooltip key={g} title={info.label}>
                                    <Box
                                        component="button"
                                        onClick={() => setDraftNag(selected ? '' : g)}
                                        sx={{
                                            cursor: 'pointer', border: 'none', borderRadius: '4px',
                                            px: 0.75, py: 0.5, fontWeight: 800, fontSize: '0.75rem',
                                            color: selected ? '#10131a' : NAG_TONE_COLOR[info.tone],
                                            backgroundColor: selected ? NAG_TONE_COLOR[info.tone] : 'rgba(255,255,255,0.08)',
                                            outline: selected ? '2px solid rgba(255,255,255,0.5)' : 'none',
                                        }}
                                    >
                                        {g}
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>
                    <TextField
                        placeholder="Comment (optional)"
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        size="small" multiline minRows={2} fullWidth
                        inputProps={{ style: { color: 'white' } }}
                        sx={{ mb: 1, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
                    />
                    <Button
                        onClick={submit}
                        disabled={!draftNag && !draftText.trim()}
                        variant="contained" size="small" fullWidth
                        sx={{ backgroundColor: 'var(--initiative-blue)', '&:hover': { backgroundColor: 'rgba(0,186,255,0.8)' } }}
                    >
                        Add note
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default ReviewPanel;
