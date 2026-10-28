'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Box, Card, Grid, Typography, IconButton, useTheme } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReplayProvider, useReplay } from '@/app/_contexts/Replay.context';
import { ReplayAnnotationsProvider } from '@/app/_contexts/ReplayAnnotations.context';
import FileUpload from '@/app/_components/Replay/FileUpload';
import TransportControls from '@/app/_components/Replay/TransportControls';
import ReplayPanel from '@/app/_components/Replay/ReplayPanel';
import LastActionCaption from '@/app/_components/Replay/LastActionCaption';
import ReplayAnimator from '@/app/_components/Replay/ReplayAnimator';
import BoardChevrons from '@/app/_components/Replay/BoardChevrons';
import RecentReplays from '@/app/_components/Replay/RecentReplays';
import OpponentCardTray from '@/app/_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '@/app/_components/Gameboard/Board/Board';
import PlayerCardTray from '@/app/_components/Gameboard/PlayerCardTray/PlayerCardTray';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import PopupShell from '@/app/_components/_sharedcomponents/Popup/Popup';
import { displayText, parse, SwuPgnDocument } from '@/lib/swupgn';
import { loadReplay } from '@/app/_utils/replayStorage';
import { replayUrl, storeReplayContent, replayTooHeavy } from '@/app/_utils/replayHandoff';
import { formatResult, resultOf } from '@/app/_utils/replayMoves';
import { useCardNameMap } from '@/app/_utils/swupgnCardNames';
import { replayErrorMessage } from '@/app/_utils/swupgnFileIssues';
import { REPLAY_PANEL_WIDTH, REPLAY_TRANSPORT_HEIGHT } from '@/app/_constants/replayLayout';

function ReplayHeader({ header }: { header: SwuPgnDocument['header'] }) {
    const router = useRouter();
    const { nameOf } = useReplay();
    const player1 = displayText(header.p1) || 'Player 1';
    const player2 = displayText(header.p2) || 'Player 2';
    // Leaders are SET#NUM ids in the .swupgn header; resolve to names like the move list.
    const leader1 = header.p1Leader ? nameOf(header.p1Leader) : '';
    const leader2 = header.p2Leader ? nameOf(header.p2Leader) : '';
    // An outcome this viewer does not know (a newer minor's, §18) reads as Incomplete.
    const result = resultOf(header.result);
    const formattedResult = formatResult(result);

    const isP1Winner = result === 'P1';
    const isP2Winner = result === 'P2';

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                // On a phone the result chip wraps to its own line, and the right padding keeps
                // the absolutely placed exit button clear of the names.
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: { xs: 1, sm: 2 },
                py: 1,
                pl: 3,
                pr: { xs: 6, sm: 3 },
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.15)',
                zIndex: 10,
                position: 'relative',
            }}
        >
            <IconButton
                onClick={() => router.push('/')}
                sx={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.5)',
                    '&:hover': { color: 'white' },
                }}
                title="Exit replay"
            >
                <CloseOutlined />
            </IconButton>
            <Box sx={{ textAlign: 'right', minWidth: { xs: 0, sm: '120px' } }}>
                <Typography variant="body1" sx={{
                    color: isP1Winner ? 'var(--initiative-blue)' : 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    textShadow: isP1Winner ? '0 0 10px rgba(0,186,255,0.5)' : 'none',
                }}>
                    {player1}
                </Typography>
                {leader1 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                        {leader1}
                    </Typography>
                )}
            </Box>
            <Typography variant="h6" sx={{
                color: 'rgba(255,255,255,0.3)',
                fontWeight: 300,
                fontStyle: 'italic',
                mx: 1,
            }}>
                vs
            </Typography>
            <Box sx={{ textAlign: 'left', minWidth: { xs: 0, sm: '120px' } }}>
                <Typography variant="body1" sx={{
                    color: isP2Winner ? 'var(--initiative-blue)' : 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    textShadow: isP2Winner ? '0 0 10px rgba(0,186,255,0.5)' : 'none',
                }}>
                    {player2}
                </Typography>
                {leader2 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                        {leader2}
                    </Typography>
                )}
            </Box>
            {/* A phone-only line break, so the result chip always takes a line of its own. */}
            {formattedResult && <Box sx={{ display: { xs: 'block', sm: 'none' }, flexBasis: '100%', height: 0 }} />}
            {formattedResult && (
                <Box sx={{
                    ml: { xs: 0, sm: 2 },
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0,186,255,0.15)',
                    border: '1px solid rgba(0,186,255,0.3)',
                }}>
                    <Typography variant="body2" sx={{
                        color: 'var(--initiative-blue)',
                        fontWeight: 'bold',
                        letterSpacing: '0.05em',
                    }}>
                        {formattedResult}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

function ReplayBoardContent({ header }: { header: SwuPgnDocument['header'] }) {
    const { gameState, connectedPlayer, getOpponent } = useReplay();
    // The animator's coordinate space: <main> holds BOTH trays and the board, so a
    // hand -> arena flight measures in one frame of reference.
    const mainRef = useRef<HTMLElement>(null);
    const theme = useTheme();
    // Collapsed by default on a phone: the panel is fixed at 88vw, so open-by-default
    // covers the board completely and leaves the game as a sliver down one edge. Same
    // breakpoint as the panel's `{ xs, sm }` sx values, so the two rules cannot split.
    const [panelCollapsed, setPanelCollapsed] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia(theme.breakpoints.down('sm').replace(/^@media\s*/, '')).matches);

    if (!gameState?.players) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'rgba(255,255,255,0.5)' }}>
                <Typography variant="h6">Loading snapshot...</Typography>
            </Box>
        );
    }

    return (
        <>
            {/* The background sits on the container so it still fills the strip beside the
                header when <main> narrows for the open panel. */}
            <Grid container sx={{
                height: '100dvh', overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200,
                backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')}?v=2)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}>
                <Box
                    component="main"
                    ref={mainRef}
                    sx={{
                        // From md up the open panel sits beside the board, not over it;
                        // a phone or small tablet keeps the overlay.
                        width: panelCollapsed ? '100%' : { xs: '100%', md: `calc(100% - ${REPLAY_PANEL_WIDTH}px)` },
                        height: '100dvh',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <ReplayHeader header={header} />
                    {/* Trays mirror the live GameBoard ratios (opponent 15dvh /
                        player 18dvh); the board flexes to fill whatever remains
                        after the header and the transport bar, so the column
                        can never overflow 100dvh and clip the player tray. */}
                    <Box sx={{ height: '15dvh' }}>
                        <OpponentCardTray trayPlayer={getOpponent(connectedPlayer)} />
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 2 }}>
                        <Board sidebarOpen={false} />
                    </Box>
                    <Box sx={{ height: '18dvh', mb: `${REPLAY_TRANSPORT_HEIGHT}px` }}>
                        <PlayerCardTray trayPlayer={connectedPlayer} />
                    </Box>
                    <BoardChevrons />
                    <ReplayAnimator containerRef={mainRef} />
                </Box>
                <PopupShell sidebarOpen={false} />
            </Grid>
            <ReplayPanel collapsed={panelCollapsed} setCollapsed={setPanelCollapsed} />
            <LastActionCaption />
            <TransportControls />
        </>
    );
}

function ReplayBoard({ doc, replayId, initialFrame, clipStart, clipEnd }: {
    doc: SwuPgnDocument;
    replayId: string | null;
    initialFrame: number | string;
    clipStart: string | null;
    clipEnd: string | null;
}) {
    // SET#NUM→name map from public/card-names.json (npm run gen:card-data). Empty until
    // it loads, then the move list / captions re-render with names; unknown ids fall back.
    const cardNameMap = useCardNameMap();
    return (
        <ReplayProvider doc={doc} replayId={replayId} initialFrame={initialFrame} nameMap={cardNameMap} clipStart={clipStart} clipEnd={clipEnd}>
            <ReplayAnnotationsProvider doc={doc} replayId={replayId}>
                <ReplayBoardContent header={doc.header} />
            </ReplayAnnotationsProvider>
        </ReplayProvider>
    );
}

export default function ReplayPage() {
    // The replay on screen and the id it is stored under: null while an upload is not stored
    // (yet, or at all). A doc is only ever shown for its own id, so following a link or Back to
    // another replay loads that one instead of keeping the last.
    const [loaded, setLoaded] = useState<{ id: string | null; doc: SwuPgnDocument } | null>(null);
    const loadedRef = useRef(loaded);
    const show = (next: typeof loaded) => {
        loadedRef.current = next;
        setLoaded(next);
    };
    // Bumped by every load and upload; a load or store that finishes after a newer one started
    // is dropped instead of replacing what the newer one shows.
    const loadSeq = useRef(0);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const replayId = searchParams.get('id');
    // `t`, `from` and `to` are each a `seq` ("R4.A.8u"), which survives the reader dropping
    // inert records. Older links carry a bare frame index; both are accepted and resolved
    // against the stream by ReplayProvider, so they stay strings here.
    const clipStart = searchParams.get('from');
    const clipEnd = searchParams.get('to');
    const tParam = searchParams.get('t');
    const initialFrame = tParam || clipStart || 0;

    // Whenever the URL's id changes, show that replay from IndexedDB.
    useEffect(() => {
        // Already on screen: the upload that was just stored under this id.
        if (replayId && loadedRef.current?.id === replayId) return;
        const seq = ++loadSeq.current;
        show(null);
        setLoadError(null);
        setLoading(!!replayId);
        if (!replayId) return;

        loadReplay(replayId)
            .then((content) => {
                if (seq !== loadSeq.current || !content) return;
                const parsed = parse(content);
                // A replay stored before the frame budget existed is refused here, so
                // reopening it from Recent Replays cannot hang the tab.
                const heavy = parsed.events.length > 0 ? replayTooHeavy(parsed) : null;
                if (heavy) {
                    setLoadError(heavy);
                } else if (parsed.events.length > 0) {
                    show({ id: replayId, doc: parsed });
                } else {
                    // It IS stored, so "isn't stored on this device" would be wrong.
                    setLoadError('This stored replay could not be read: it has no game records.');
                }
            })
            .catch((err) => {
                if (seq !== loadSeq.current) return;
                // Load/parse of a stored replay failed; say so above the upload prompt
                // rather than claiming the replay isn't stored.
                console.warn('Failed to load stored replay', replayId, err);
                setLoadError(`This stored replay could not be read. ${replayErrorMessage(err)}`);
            })
            .finally(() => {
                if (seq === loadSeq.current) setLoading(false);
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [replayId]);

    // When a file is uploaded, show it, store it, and put the id it was stored under in the URL
    const handleReplayLoaded = async (doc: SwuPgnDocument, content: string) => {
        const seq = ++loadSeq.current;
        setLoading(false);
        setLoadError(null);
        show({ id: null, doc });
        try {
            // FileUpload has parsed and budget-checked `doc` already. The id may differ from
            // the content hash when another file already holds it (storeReplay).
            const { id } = await storeReplayContent(content, doc);
            if (seq !== loadSeq.current) return;
            show({ id, doc });
            router.replace(replayUrl(id, searchParams), { scroll: false });
        } catch (err) {
            // Storage failed (e.g. QuotaExceededError); replay still works in-memory,
            // it just won't survive a refresh. Log so the failure isn't invisible.
            console.warn('Failed to persist replay to IndexedDB', err);
        }
    };

    if (loaded) {
        // The stored id, never the URL's: until the upload is stored the URL may still name
        // another replay, and notes saved under it would land on that one.
        return <ReplayBoard doc={loaded.doc} replayId={loaded.id} initialFrame={initialFrame} clipStart={clipStart} clipEnd={clipEnd} />;
    }

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: 'calc(100vh - 4rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pt: '5rem',
                pb: 4,
            }}
        >
            <Card
                variant="blue"
                sx={{
                    width: '100%',
                    maxWidth: '560px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                <Typography variant="h1" sx={{ mb: 0 }}>
                    Replay Viewer
                </Typography>
                <Typography variant="body1" sx={{
                    color: 'rgba(255,255,255,0.6)',
                    mb: 1,
                }}>
                    {loading
                        ? 'Loading replay...'
                        : replayId && !loadError
                            ? 'This replay isn\'t stored on this device. Replays live in your browser, not on a server, so a link on its own can\'t open one — drop the .swupgn file below and the link will jump to the exact moment it points at.'
                            : 'Upload a game replay file to watch every turn play out in the simulator.'
                    }
                </Typography>
                {/* A stored replay the viewer refused: an error, said as one, above the upload box. */}
                {!loading && loadError && (
                    <Typography variant="body2" role="alert" sx={{ color: 'error.main', mt: -1 }}>
                        {loadError}
                    </Typography>
                )}
                <FileUpload onReplayLoaded={handleReplayLoaded} />
                <RecentReplays />
            </Card>
        </Box>
    );
}
