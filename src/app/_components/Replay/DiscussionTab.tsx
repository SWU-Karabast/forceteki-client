'use client';
import React, { useMemo, useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, Tooltip } from '@mui/material';
import { Close, Reply } from '@mui/icons-material';
import type { Annotation } from '@/lib/swupgn';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useReplayAnnotations } from '@/app/_contexts/ReplayAnnotations.context';
import { buildThreads, type ThreadNode } from '@/app/_utils/annotationThreads';
import { NAG_ORDER, nagInfo, NAG_TONE_COLOR } from '@/app/_utils/nagGlyphs';
import AnnotationBadge from './AnnotationBadge';

// A note carries a client `_id` while in the working copy; file notes carry `id`.
type Note = Annotation & { _id?: string };
const idOf = (n: Note) => n._id ?? n.id;

const NagPicker: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
        {NAG_ORDER.map((g) => {
            const info = nagInfo(g)!;
            const active = value === g;
            return (
                <Tooltip key={g} title={info.label}>
                    <Box
                        component="span"
                        onClick={() => onChange(active ? '' : g)}
                        sx={{
                            cursor: 'pointer', px: 0.75, py: 0.1, borderRadius: '4px', fontWeight: 700,
                            fontSize: '0.8rem', userSelect: 'none', lineHeight: 1.6,
                            color: active ? '#0c0f16' : NAG_TONE_COLOR[info.tone],
                            backgroundColor: active ? NAG_TONE_COLOR[info.tone] : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${NAG_TONE_COLOR[info.tone]}55`,
                        }}
                    >
                        {info.glyph}
                    </Box>
                </Tooltip>
            );
        })}
    </Box>
);

const Composer: React.FC<{ onSubmit: (text: string, nag: string) => void; withNag?: boolean; placeholder: string; compact?: boolean }> = ({
    onSubmit, withNag = false, placeholder, compact = false,
}) => {
    const [text, setText] = useState('');
    const [nag, setNag] = useState('');
    const submit = () => {
        if (!text.trim() && !nag) return;
        onSubmit(text.trim(), nag);
        setText(''); setNag('');
    };
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: compact ? 0.75 : 1 }}>
            {withNag && <NagPicker value={nag} onChange={setNag} />}
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                <TextField
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    size="small"
                    multiline
                    maxRows={4}
                    fullWidth
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(); }}
                    sx={{
                        '& .MuiInputBase-root': { color: 'white', fontSize: '0.82rem', backgroundColor: 'rgba(255,255,255,0.04)' },
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                    }}
                />
                <Button onClick={submit} size="small" variant="contained"
                    sx={{ minWidth: 0, px: 1.5, backgroundColor: 'var(--initiative-blue)', flexShrink: 0 }}>
                    {compact ? 'Reply' : 'Post'}
                </Button>
            </Box>
        </Box>
    );
};

const NoteCard: React.FC<{
    node: ThreadNode<Note>;
    onReply: (parentId: string, text: string) => void;
    onDelete: (id: string) => void;
    depth?: number;
}> = ({ node, onReply, onDelete, depth = 0 }) => {
    const [replying, setReplying] = useState(false);
    const n = node.note;
    const id = idOf(n);
    const editable = !!n._id; // only the session's own working notes can be deleted
    return (
        <Box sx={{ mt: 1, ml: depth ? 1.5 : 0, pl: depth ? 1 : 0, borderLeft: depth ? '2px solid rgba(255,255,255,0.1)' : 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                {n.nag && <AnnotationBadge nag={n.nag} size={16} />}
                <Typography variant="caption" sx={{ color: 'var(--initiative-blue)', fontWeight: 700 }}>
                    {n.by || 'Anonymous'}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {id && (
                    <Tooltip title="Reply">
                        <IconButton size="small" onClick={() => setReplying((r) => !r)} sx={{ color: 'rgba(255,255,255,0.5)', p: 0.25 }}>
                            <Reply sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                )}
                {editable && (
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onDelete(n._id!)} sx={{ color: 'rgba(255,255,255,0.4)', p: 0.25 }}>
                            <Close sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            {n.text && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.84rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {n.text}
                </Typography>
            )}
            {replying && id && (
                <Composer compact placeholder={`Reply to ${n.by || 'Anonymous'}…`} onSubmit={(text) => { if (text) { onReply(id, text); setReplying(false); } }} />
            )}
            {node.replies.map((child, i) => (
                <NoteCard key={idOf(child.note) ?? i} node={child} onReply={onReply} onDelete={onDelete} depth={depth + 1} />
            ))}
        </Box>
    );
};

/** Threaded discussion for the current frame's move. Notes + replies persist locally and
 *  serialize into the .swupgn, so a shared file carries the conversation. */
const DiscussionTab: React.FC = () => {
    const { doc, currentIndex } = useReplay();
    const { threadFor, addAnnotation, deleteAnnotation, author, setAuthor } = useReplayAnnotations();

    const seq = doc.events[currentIndex]?.seq;
    const notes = (seq ? threadFor(seq) : []) as Note[];
    const threads = useMemo(
        () => buildThreads<Note>(notes, idOf, (n) => n.parent, (n) => n.ts ?? 0),
        [notes],
    );

    return (
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <TextField
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Your name"
                size="small"
                sx={{
                    mb: 1.5,
                    '& .MuiInputBase-root': { color: 'white', fontSize: '0.82rem' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                }}
            />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', mb: 0.5 }}>
                Discussion on this move{seq ? ` (${seq})` : ''}
            </Typography>
            <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {threads.length === 0 && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', mt: 1 }}>
                        No notes here yet. Start the thread below.
                    </Typography>
                )}
                {threads.map((node, i) => (
                    <NoteCard
                        key={idOf(node.note) ?? i}
                        node={node}
                        onReply={(parentId, text) => seq && addAnnotation(seq, { text, parent: parentId })}
                        onDelete={(id) => deleteAnnotation(id)}
                    />
                ))}
            </Box>
            {seq && (
                <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 1, mt: 1 }}>
                    <Composer withNag placeholder="Add a note on this move…" onSubmit={(text, nag) => addAnnotation(seq, { text, nag })} />
                </Box>
            )}
        </Box>
    );
};

export default DiscussionTab;
