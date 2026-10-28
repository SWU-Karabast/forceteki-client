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
import { generateReplayId, loadReplay } from '@/app/_utils/replayStorage';
import { replayUrl, storeReplayContent, replayTooHeavy } from '@/app/_utils/replayHandoff';
import { formatResult, resultOf } from '@/app/_utils/replayMoves';
import { useCardNameMap } from '@/app/_utils/swupgnCardNames';
import { replayErrorMessage } from '@/app/_utils/swupgnFileIssues';
import { REPLAY_PANEL_WIDTH, REPLAY_TRANSPORT_HEIGHT } from '@/app/_constants/replayLayout';

interface IReplayHeaderProps {
    header: SwuPgnDocument['header'];
}

interface IReplayBoardContentProps {
    header: SwuPgnDocument['header'];
}

interface IReplayBoardProps {
    doc: SwuPgnDocument;
    replayId: string | null;
    initialFrame: number | string;
    clipStart: string | null;
    clipEnd: string | null;
}

function ReplayHeader({ header }: IReplayHeaderProps) {
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
            sx={styles.header}
        >
            <IconButton
                onClick={() => router.push('/')}
                sx={styles.exitButton}
                title="Exit replay"
            >
                <CloseOutlined />
            </IconButton>
            <Box sx={styles.player1}>
                <Typography variant="body1" sx={styles.playerName(isP1Winner)}>
                    {player1}
                </Typography>
                {leader1 && (
                    <Typography variant="caption" sx={styles.leader}>
                        {leader1}
                    </Typography>
                )}
            </Box>
            <Typography variant="h6" sx={styles.versus}>
                vs
            </Typography>
            <Box sx={styles.player2}>
                <Typography variant="body1" sx={styles.playerName(isP2Winner)}>
                    {player2}
                </Typography>
                {leader2 && (
                    <Typography variant="caption" sx={styles.leader}>
                        {leader2}
                    </Typography>
                )}
            </Box>
            {/* A phone-only line break, so the result chip always takes a line of its own. */}
            {formattedResult && <Box sx={styles.resultBreak} />}
            {formattedResult && (
                <Box sx={styles.resultChip}>
                    <Typography variant="body2" sx={styles.resultText}>
                        {formattedResult}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}

function ReplayBoardContent({ header }: IReplayBoardContentProps) {
    const { gameState, connectedPlayer, getOpponent } = useReplay();
    // The animator's coordinate space: <main> holds BOTH trays and the board, so a
    // hand -> arena flight measures in one frame of reference.
    const mainRef = useRef<HTMLElement>(null);
    const theme = useTheme();
    // Collapsed by default below md: there the panel overlays the board (88vw on a phone,
    // 360px on a small tablet, 40-60% of the board), and only from md up does <main> narrow
    // to sit beside it. Same breakpoint as styles.main's `md`, so the two rules cannot split.
    const [panelCollapsed, setPanelCollapsed] = useState(() =>
        typeof window !== 'undefined' && window.matchMedia(theme.breakpoints.down('md').replace(/^@media\s*/, '')).matches);

    if (!gameState?.players) {
        return (
            <Box sx={styles.loadingSnapshot}>
                <Typography variant="h6">Loading snapshot...</Typography>
            </Box>
        );
    }

    return (
        <>
            {/* The background sits on the container so it still fills the strip beside the
                header when <main> narrows for the open panel. */}
            <Grid container sx={styles.boardContainer}>
                <Box
                    component="main"
                    ref={mainRef}
                    sx={styles.main(panelCollapsed)}
                >
                    <ReplayHeader header={header} />
                    {/* Trays mirror the live GameBoard ratios (opponent 15dvh /
                        player 18dvh); the board flexes to fill whatever remains
                        after the header and the transport bar, so the column
                        can never overflow 100dvh and clip the player tray. */}
                    <Box sx={styles.opponentTray}>
                        <OpponentCardTray trayPlayer={getOpponent(connectedPlayer)} />
                    </Box>
                    <Box sx={styles.board}>
                        <Board sidebarOpen={false} />
                    </Box>
                    <Box sx={styles.playerTray}>
                        <PlayerCardTray trayPlayer={connectedPlayer} />
                    </Box>
                    <BoardChevrons />
                    <ReplayAnimator containerRef={mainRef} />
                </Box>
                <PopupShell sidebarOpen={false} />
            </Grid>
            <ReplayPanel collapsed={panelCollapsed} setCollapsed={setPanelCollapsed} />
            <LastActionCaption panelOpen={!panelCollapsed} />
            <TransportControls />
        </>
    );
}

function ReplayBoard({ doc, replayId, initialFrame, clipStart, clipEnd }: IReplayBoardProps) {
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
    // `linked`: the URL's t/from/to belong to this replay, so the board opens at them.
    const [loaded, setLoaded] = useState<{ id: string | null; doc: SwuPgnDocument; linked: boolean } | null>(null);
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
                    show({ id: replayId, doc: parsed, linked: true });
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
        // A link's moment (t/from/to) is for the replay it names: it applies to the dropped
        // file only when that file is the one the link's id was hashed from (or there is no id).
        const linked = !replayId || replayId === await generateReplayId(doc.header, content);
        if (seq !== loadSeq.current) return;
        show({ id: null, doc, linked });
        try {
            // FileUpload has parsed and budget-checked `doc` already. The id may differ from
            // the content hash when another file already holds it (storeReplay).
            const { id } = await storeReplayContent(content, doc);
            if (seq !== loadSeq.current) return;
            show({ id, doc, linked });
            router.replace(replayUrl(id, linked ? searchParams : new URLSearchParams()), { scroll: false });
        } catch (err) {
            // Storage failed (e.g. QuotaExceededError); replay still works in-memory,
            // it just won't survive a refresh. Log so the failure isn't invisible.
            console.warn('Failed to persist replay to IndexedDB', err);
        }
    };

    if (loaded) {
        // The stored id, never the URL's: until the upload is stored the URL may still name
        // another replay, and notes saved under it would land on that one.
        return loaded.linked
            ? <ReplayBoard doc={loaded.doc} replayId={loaded.id} initialFrame={initialFrame} clipStart={clipStart} clipEnd={clipEnd} />
            : <ReplayBoard doc={loaded.doc} replayId={loaded.id} initialFrame={0} clipStart={null} clipEnd={null} />;
    }

    return (
        <Box
            sx={styles.uploadPage}
        >
            <Card
                variant="blue"
                sx={styles.uploadCard}
            >
                <Typography variant="h1" sx={styles.uploadTitle}>
                    Replay Viewer
                </Typography>
                <Typography variant="body1" sx={styles.uploadIntro}>
                    {loading
                        ? 'Loading replay...'
                        : replayId && !loadError
                            ? 'This replay isn\'t stored on this device. Replays live in your browser, not on a server, so a link on its own can\'t open one — drop the .swupgn file below and the link will jump to the exact moment it points at.'
                            : 'Upload a game replay file to watch every turn play out in the simulator.'
                    }
                </Typography>
                {/* A stored replay the viewer refused: an error, said as one, above the upload box. */}
                {!loading && loadError && (
                    <Typography variant="body2" role="alert" sx={styles.loadError}>
                        {loadError}
                    </Typography>
                )}
                <FileUpload onReplayLoaded={handleReplayLoaded} />
                <RecentReplays />
            </Card>
        </Box>
    );
}

// ----------------Styles----------------//
const styles = {
    header: {
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
    },
    exitButton: {
        position: 'absolute',
        right: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'rgba(255,255,255,0.5)',
        '&:hover': { color: 'white' },
    },
    player1: {
        textAlign: 'right',
        minWidth: { xs: 0, sm: '120px' },
    },
    player2: {
        textAlign: 'left',
        minWidth: { xs: 0, sm: '120px' },
    },
    playerName: (isWinner: boolean) => ({
        color: isWinner ? 'var(--initiative-blue)' : 'white',
        fontWeight: 'bold',
        fontSize: '1.1rem',
        textShadow: isWinner ? '0 0 10px rgba(0,186,255,0.5)' : 'none',
    }),
    leader: {
        color: 'rgba(255,255,255,0.5)',
        display: 'block',
    },
    versus: {
        color: 'rgba(255,255,255,0.3)',
        fontWeight: 300,
        fontStyle: 'italic',
        mx: 1,
    },
    resultBreak: {
        display: { xs: 'block', sm: 'none' },
        flexBasis: '100%',
        height: 0,
    },
    resultChip: {
        ml: { xs: 0, sm: 2 },
        px: 1.5,
        py: 0.5,
        borderRadius: '4px',
        backgroundColor: 'rgba(0,186,255,0.15)',
        border: '1px solid rgba(0,186,255,0.3)',
    },
    resultText: {
        color: 'var(--initiative-blue)',
        fontWeight: 'bold',
        letterSpacing: '0.05em',
    },
    loadingSnapshot: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        color: 'rgba(255,255,255,0.5)',
    },
    boardContainer: {
        height: '100dvh', overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200,
        backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')}?v=2)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    },
    main: (panelCollapsed: boolean) => ({
        // From md up the open panel sits beside the board, not over it;
        // a phone or small tablet keeps the overlay.
        width: panelCollapsed ? '100%' : { xs: '100%', md: `calc(100% - ${REPLAY_PANEL_WIDTH}px)` },
        height: '100dvh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
    }),
    opponentTray: {
        height: '15dvh',
    },
    board: {
        flex: 1,
        minHeight: 0,
        position: 'relative',
        zIndex: 2,
    },
    playerTray: {
        height: '18dvh',
        mb: `${REPLAY_TRANSPORT_HEIGHT}px`,
    },
    uploadPage: {
        width: '100%',
        minHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pt: '5rem',
        pb: 4,
    },
    uploadCard: {
        width: '100%',
        maxWidth: '560px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    uploadTitle: {
        mb: 0,
    },
    uploadIntro: {
        color: 'rgba(255,255,255,0.6)',
        mb: 1,
    },
    loadError: {
        color: 'error.main',
        mt: -1,
    },
};
