'use client';
import React, { useMemo, useState } from 'react';
import { Box, Typography, TextField, Button, IconButton, Tooltip } from '@mui/material';
import { Close, Reply } from '@mui/icons-material';
import { displayText, type Annotation } from '@/lib/swupgn';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useReplayAnnotations } from '@/app/_contexts/ReplayAnnotations.context';
import { buildThreads, type ThreadNode } from '@/app/_utils/annotationThreads';
import { NAG_ORDER, nagInfo, NAG_TONE_COLOR } from '@/app/_utils/nagGlyphs';
import AnnotationBadge from './AnnotationBadge';

// A phone needs a 44px hit area; from md up the buttons keep their compact size.
const TOUCH_TARGET = { minWidth: { xs: 44, md: 0 }, minHeight: { xs: 44, md: 0 } };

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
                        role="button"
                        tabIndex={0}
                        aria-pressed={active}
                        aria-label={info.label}
                        onClick={() => onChange(active ? '' : g)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(active ? '' : g); } }}
                        sx={{
                            cursor: 'pointer', px: 0.75, py: 0.1, borderRadius: '4px', fontWeight: 700,
                            fontSize: '0.8rem', userSelect: 'none', lineHeight: 1.6,
                            color: active ? '#0c0f16' : NAG_TONE_COLOR[info.tone],
                            backgroundColor: active ? NAG_TONE_COLOR[info.tone] : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${NAG_TONE_COLOR[info.tone]}55`,
                            '&:hover': { backgroundColor: active ? NAG_TONE_COLOR[info.tone] : 'rgba(255,255,255,0.14)' },
                            '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: 1 },
                        }}
                    >
                        {info.glyph}
                    </Box>
                </Tooltip>
            );
        })}
    </Box>
);

/**
 * A note's draft. The move it is about is pinned when the draft starts (`seq` at the first
 * keystroke or glyph), not read at Post: autoplay, a looping clip link or the scrubber can move
 * the playhead while the user types, and the note must land on the move they were writing about.
 */
const Composer: React.FC<{ seq: string; onSubmit: (text: string, nag: string, ref: string) => void; withNag?: boolean; placeholder: string; compact?: boolean }> = ({
    seq, onSubmit, withNag = false, placeholder, compact = false,
}) => {
    const [text, setText] = useState('');
    const [nag, setNag] = useState('');
    const [pinned, setPinned] = useState<string | null>(null);
    // An empty draft follows the playhead; a started one keeps the move it began on.
    const track = (nextText: string, nextNag: string) => setPinned(nextText || nextNag ? (pinned ?? seq) : null);
    const submit = () => {
        if (!text.trim() && !nag) return;
        onSubmit(text.trim(), nag, pinned ?? seq);
        setText(''); setNag(''); setPinned(null);
    };
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: compact ? 0.75 : 1 }}>
            {withNag && <NagPicker value={nag} onChange={(v) => { setNag(v); track(text, v); }} />}
            {pinned && pinned !== seq && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                    Posting on move {displayText(pinned)}
                </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start' }}>
                <TextField
                    value={text}
                    onChange={(e) => { setText(e.target.value); track(e.target.value, nag); }}
                    placeholder={placeholder}
                    inputProps={{ 'aria-label': placeholder }}
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
    onReply: (parentId: string, ref: string, text: string) => void;
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
                    {displayText(n.by) || 'Anonymous'}
                </Typography>
                <Box sx={{ flex: 1 }} />
                {id && (
                    <Tooltip title="Reply">
                        <IconButton size="small" onClick={() => setReplying((r) => !r)} sx={{ color: 'rgba(255,255,255,0.5)', p: 0.25, ...TOUCH_TARGET }}>
                            <Reply sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                )}
                {editable && (
                    <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => onDelete(n._id!)} sx={{ color: 'rgba(255,255,255,0.4)', p: 0.25, ...TOUCH_TARGET }}>
                            <Close sx={{ fontSize: 15 }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
            {n.text && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.84rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {displayText(n.text)}
                </Typography>
            )}
            {replying && id && (
                <Composer compact seq={n.ref} placeholder={`Reply to ${displayText(n.by) || 'Anonymous'}…`} onSubmit={(text, _nag, ref) => { if (text) { onReply(id, ref, text); setReplying(false); } }} />
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
    const { events, currentBeat } = useReplay();
    const { threadFor, addAnnotation, deleteAnnotation, author, setAuthor } = useReplayAnnotations();

    // The beat's own record, the one the Moves list names: the playhead rests on a beat's LAST
    // record, which for an attack is a consequence like `R2.A.6a`, not the move.
    const seq = events[currentBeat.anchor]?.seq;
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
                inputProps={{ 'aria-label': 'Your name' }}
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
                {threads.map((node, i) => {
                    const noteKey = idOf(node.note) ?? i;
                    return (
                        <NoteCard
                            key={noteKey}
                            node={node}
                            // A reply goes on its parent's move, wherever the playhead is now.
                            onReply={(parentId, ref, text) => addAnnotation(ref, { text, parent: parentId })}
                            onDelete={(id) => deleteAnnotation(id)}
                        />
                    );
                })}
            </Box>
            {seq && (
                <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 1, mt: 1 }}>
                    <Composer withNag seq={seq} placeholder="Add a note on this move…" onSubmit={(text, nag, ref) => addAnnotation(ref, { text, nag })} />
                </Box>
            )}
        </Box>
    );
};

export default DiscussionTab;
