'use client';
import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Snackbar, CircularProgress, Button, useTheme } from '@mui/material';
import {
    ChevronRight, ChevronLeft, FormatListBulleted, BarChartOutlined, CallSplitOutlined, MenuBookOutlined, StyleOutlined,
    ViewDayOutlined, ChatBubbleOutline, LinkOutlined, FileDownloadOutlined, DescriptionOutlined,
    VisibilityOutlined, VisibilityOffOutlined, ContentCut, FirstPage, LastPage, MovieCreationOutlined,
} from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { useReplayAnnotations } from '@/app/_contexts/ReplayAnnotations.context';
import { downloadClipWebm } from '@/app/_utils/exportClipWebm';
import MovesTab from './MovesTab';
import FileHealth from './FileHealth';
import DeckTab from './DeckTab';
import StoryTab from './StoryTab';
import ResourcingReport from './ResourcingReport';
import DecisionReview from './DecisionReview';
import TurnDigests from './TurnDigests';
import DiscussionTab from './DiscussionTab';

type TabKey = 'story' | 'moves' | 'deck' | 'resourcing' | 'decisions' | 'digest' | 'discussion';
const TABS: { key: TabKey; label: string; Icon: React.ElementType; Body: React.FC }[] = [
    { key: 'story', label: 'Story', Icon: MenuBookOutlined, Body: StoryTab },
    { key: 'moves', label: 'Moves', Icon: FormatListBulleted, Body: MovesTab },
    { key: 'deck', label: 'Deck', Icon: StyleOutlined, Body: DeckTab },
    { key: 'resourcing', label: 'Resourcing', Icon: BarChartOutlined, Body: ResourcingReport },
    { key: 'decisions', label: 'Decisions', Icon: CallSplitOutlined, Body: DecisionReview },
    { key: 'digest', label: 'Digest', Icon: ViewDayOutlined, Body: TurnDigests },
    { key: 'discussion', label: 'Discussion', Icon: ChatBubbleOutline, Body: DiscussionTab },
];

const PANEL_BG = 'rgba(8,11,17,0.94)';
const BORDER = '1px solid rgba(255,255,255,0.1)';

const ReplayPanel: React.FC = () => {
    const {
        header, totalFrames, replayId, currentIndex, events, downloadTextLog, fogOfWar, toggleFogOfWar,
        clip, setClipStart, setClipEnd, clearClip, doc, moves, nameOf,
    } = useReplay();
    const { downloadWithAnnotations } = useReplayAnnotations();
    const theme = useTheme();
    // Collapsed by default on a phone: the panel is fixed at 88vw, so open-by-default
    // covers the board completely and leaves the game as a sliver down one edge. Same
    // breakpoint as the `{ xs, sm }` sx values below, so the two rules cannot split.
    const [collapsed, setCollapsed] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia(theme.breakpoints.down('sm').replace(/^@media\s*/, '')).matches);
    const [tab, setTab] = useState<TabKey>('moves');
    const [snack, setSnack] = useState<string | null>(null);
    const [recording, setRecording] = useState(false);

    if (totalFrames === 0) return null;

    const copy = (url: string, msg: string) => {
        navigator.clipboard?.writeText(url).then(() => setSnack(msg)).catch(() => setSnack('Copy failed'));
    };
    const shareMoment = () => {
        const base = `${window.location.origin}/Replay?id=${replayId ?? ''}`;
        // Share the frame's `seq`, not its index: indices shift if the reader's set of
        // dropped records changes, seqs don't.
        copy(`${base}&t=${encodeURIComponent(String(events[currentIndex]?.seq ?? currentIndex))}`,
            'Link copied — send the .swupgn with it, the replay lives in your browser');
    };
    const copyClipLink = () => {
        if (!clip) return;
        const base = `${window.location.origin}/Replay?id=${replayId ?? ''}`;
        copy(`${base}&from=${clip.start}&to=${clip.end}`,
            'Clip link copied — send the .swupgn with it, the replay lives in your browser');
    };
    const exportWebm = async () => {
        if (recording) return;
        setRecording(true);
        try {
            await downloadClipWebm({
                doc, events, start: clip?.start ?? 0, end: clip?.end ?? totalFrames - 1,
                labelForSeq: (seq) => moves.find((m) => m.seq === seq)?.label, nameOf,
            });
        } catch (e) {
            setSnack(e instanceof Error ? e.message : 'Clip export failed');
        } finally {
            setRecording(false);
        }
    };

    const tabBtn = (active: boolean) => ({
        color: active ? 'var(--initiative-blue)' : 'rgba(255,255,255,0.55)',
        backgroundColor: active ? 'rgba(0,186,255,0.12)' : 'transparent',
        borderRadius: '6px',
    });

    // Collapsed: a thin rail of tab icons on the right edge; clicking opens to that tab.
    if (collapsed) {
        return (
            <Box sx={{
                position: 'fixed', top: 68, right: 0, bottom: 60, width: 48, zIndex: 1305,
                backgroundColor: PANEL_BG, borderLeft: BORDER, display: 'flex', flexDirection: 'column',
                alignItems: 'center', py: 1, gap: 0.5,
            }}>
                <Tooltip title="Open panel" placement="left">
                    <IconButton size="small" onClick={() => setCollapsed(false)} sx={{ color: 'white' }}><ChevronLeft /></IconButton>
                </Tooltip>
                {TABS.map(({ key, label, Icon }) => (
                    <Tooltip key={key} title={label} placement="left">
                        <IconButton size="small" aria-label={`${label} tab`} onClick={() => { setTab(key); setCollapsed(false); }} sx={tabBtn(false)}>
                            <Icon sx={{ fontSize: 19 }} />
                        </IconButton>
                    </Tooltip>
                ))}
            </Box>
        );
    }

    const Body = (TABS.find((t) => t.key === tab) ?? TABS[0]).Body;

    return (
        <Box sx={{
            position: 'fixed', top: 68, right: 0, bottom: 60, width: { xs: '88vw', sm: 360 }, zIndex: 1305,
            backgroundColor: PANEL_BG, borderLeft: BORDER, backdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 1, borderBottom: BORDER, gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(header.p1 || 'Player 1')} vs {(header.p2 || 'Player 2')}
                </Typography>
                <Tooltip title="Collapse panel"><IconButton size="small" onClick={() => setCollapsed(true)} sx={{ color: 'rgba(255,255,255,0.7)' }}><ChevronRight /></IconButton></Tooltip>
            </Box>

            {/* Does the file agree with itself? */}
            <Box sx={{ px: 1.5, py: 0.75, borderBottom: BORDER }}>
                <FileHealth />
            </Box>

            {/* Action toolbar (share / download / fog / clip) */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5, borderBottom: BORDER, gap: 0.25, flexWrap: 'wrap' }}>
                <Tooltip title="Copy link to this moment (send the .swupgn alongside it)"><IconButton size="small" onClick={shareMoment} sx={{ color: 'rgba(255,255,255,0.7)' }}><LinkOutlined sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Download .swupgn (with notes)"><IconButton size="small" onClick={downloadWithAnnotations} sx={{ color: 'rgba(255,255,255,0.7)' }}><FileDownloadOutlined sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Download text log"><IconButton size="small" onClick={downloadTextLog} sx={{ color: 'rgba(255,255,255,0.7)' }}><DescriptionOutlined sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title={fogOfWar ? 'Reveal hidden hands' : 'Hide non-perspective hand'}><IconButton size="small" onClick={toggleFogOfWar} sx={{ color: fogOfWar ? 'var(--initiative-blue)' : 'rgba(255,255,255,0.7)' }}>{fogOfWar ? <VisibilityOffOutlined sx={{ fontSize: 18 }} /> : <VisibilityOutlined sx={{ fontSize: 18 }} />}</IconButton></Tooltip>
                <Box sx={{ width: '1px', height: 18, backgroundColor: 'rgba(255,255,255,0.15)', mx: 0.5 }} />
                <Tooltip title="Set clip start"><IconButton size="small" onClick={setClipStart} sx={{ color: 'rgba(255,255,255,0.7)' }}><FirstPage sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Tooltip title="Set clip end"><IconButton size="small" onClick={setClipEnd} sx={{ color: 'rgba(255,255,255,0.7)' }}><LastPage sx={{ fontSize: 18 }} /></IconButton></Tooltip>
                <Typography variant="caption" sx={{ color: clip ? 'var(--initiative-blue)' : 'rgba(255,255,255,0.4)', minWidth: 44, textAlign: 'center', fontSize: '0.7rem' }}>
                    {clip ? `${clip.start}–${clip.end}` : 'clip'}
                </Typography>
                {/* The span keeps the tooltip alive while the button is disabled, but it also
                    takes the tooltip's aria-label, so the button names itself. */}
                <Tooltip title="Copy clip link"><span><IconButton size="small" aria-label="Copy clip link" onClick={copyClipLink} disabled={!clip} sx={{ color: clip ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}><ContentCut sx={{ fontSize: 16 }} /></IconButton></span></Tooltip>
                <Tooltip title="Export clip as .webm"><span><IconButton size="small" aria-label="Export clip as webm" onClick={exportWebm} disabled={recording} sx={{ color: 'rgba(255,255,255,0.7)' }}>{recording ? <CircularProgress size={15} sx={{ color: 'var(--initiative-blue)' }} /> : <MovieCreationOutlined sx={{ fontSize: 18 }} />}</IconButton></span></Tooltip>
                {clip && (
                    <Button size="small" onClick={clearClip} aria-label="Clear clip" sx={{ minWidth: 0, px: 0.75, py: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', textTransform: 'none', '&:hover': { color: 'white' } }}>
                        clear
                    </Button>
                )}
            </Box>

            {/* Tab strip. Arrow keys move between tabs, as a tablist is expected to. */}
            <Box
                role="tablist"
                aria-label="Replay panel sections"
                onKeyDown={(e) => {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                    e.preventDefault();
                    const i = TABS.findIndex((t) => t.key === tab);
                    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
                    setTab(next.key);
                    (e.currentTarget.querySelector(`[data-tab="${next.key}"]`) as HTMLElement | null)?.focus();
                }}
                sx={{ display: 'flex', px: 0.75, py: 0.5, gap: 0.25, borderBottom: BORDER }}
            >
                {TABS.map(({ key, label, Icon }) => (
                    <Tooltip key={key} title={label}>
                        <IconButton size="small" role="tab" id={`replay-tab-${key}`} data-tab={key} aria-selected={tab === key} aria-controls="replay-tabpanel" tabIndex={tab === key ? 0 : -1} aria-label={`${label} tab`} onClick={() => setTab(key)} sx={{ ...tabBtn(tab === key), flex: 1, borderRadius: '6px' }}>
                            <Icon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                ))}
            </Box>

            {/* Active tab body */}
            <Box id="replay-tabpanel" role="tabpanel" aria-labelledby={`replay-tab-${tab}`} sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <Body />
            </Box>

            <Snackbar open={!!snack} autoHideDuration={2200} onClose={() => setSnack(null)} message={snack ?? ''} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        </Box>
    );
};

export default ReplayPanel;
