'use client';
import React, { useState, useEffect } from 'react';
import { Box, Card, Grid, Typography, IconButton } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReplayProvider, useReplay } from '@/app/_contexts/Replay.context';
import FileUpload from '@/app/_components/Replay/FileUpload';
import TransportControls from '@/app/_components/Replay/TransportControls';
import MoveList from '@/app/_components/Replay/MoveList';
import LastActionCaption from '@/app/_components/Replay/LastActionCaption';
import RecentReplays from '@/app/_components/Replay/RecentReplays';
import ShareControls from '@/app/_components/Replay/ShareControls';
import OpponentCardTray from '@/app/_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '@/app/_components/Gameboard/Board/Board';
import PlayerCardTray from '@/app/_components/Gameboard/PlayerCardTray/PlayerCardTray';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import PopupShell from '@/app/_components/_sharedcomponents/Popup/Popup';
import { parse, SwuPgnDocument } from '@/lib/swupgn';
import { generateReplayId, storeReplay, loadReplay } from '@/app/_utils/replayStorage';
import { formatResult } from '@/app/_utils/replayMoves';

function ReplayHeader({ header }: { header: SwuPgnDocument['header'] }) {
    const router = useRouter();
    const player1 = header.p1 || 'Player 1';
    const player2 = header.p2 || 'Player 2';
    const leader1 = header.p1Leader || '';
    const leader2 = header.p2Leader || '';
    const result = header.result || '';
    const formattedResult = formatResult(result);

    const isP1Winner = result === 'P1';
    const isP2Winner = result === 'P2';

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                py: 1,
                px: 3,
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
            <Box sx={{ textAlign: 'right', minWidth: '120px' }}>
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
            <Box sx={{ textAlign: 'left', minWidth: '120px' }}>
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
            {formattedResult && (
                <Box sx={{
                    ml: 2,
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

    if (!gameState?.players) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'rgba(255,255,255,0.5)' }}>
                <Typography variant="h6">Loading snapshot...</Typography>
            </Box>
        );
    }

    return (
        <>
            <Grid container sx={{ height: '100dvh', overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200 }}>
                <Box
                    component="main"
                    sx={{
                        width: '100%',
                        height: '100dvh',
                        position: 'relative',
                        backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')}?v=2)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <ReplayHeader header={header} />
                    {/* Trays mirror the live GameBoard ratios (opponent 15dvh /
                        player 18dvh); the board flexes to fill whatever remains
                        after the header and the 60px transport bar, so the column
                        can never overflow 100dvh and clip the player tray. */}
                    <Box sx={{ height: '15dvh' }}>
                        <OpponentCardTray
                            trayPlayer={getOpponent(connectedPlayer)}
                            preferenceToggle={() => {}}
                        />
                    </Box>
                    <Box sx={{ flex: 1, minHeight: 0, position: 'relative', zIndex: 2 }}>
                        <Board sidebarOpen={false} />
                    </Box>
                    <Box sx={{ height: '18dvh', mb: '60px' }}>
                        <PlayerCardTray
                            trayPlayer={connectedPlayer}
                            toggleSidebar={() => {}}
                        />
                    </Box>
                </Box>
                <PopupShell sidebarOpen={false} />
            </Grid>
            <ShareControls />
            <MoveList />
            <LastActionCaption />
            <TransportControls />
        </>
    );
}

function ReplayBoard({ doc, rawContent, replayId, initialFrame }: {
    doc: SwuPgnDocument;
    rawContent: string | null;
    replayId: string | null;
    initialFrame: number;
}) {
    // TODO(card-names): source SET#NUM→name map; P0 ships id-fallback (see migration plan).
    const cardNameMap: Record<string, string> = {};
    return (
        <ReplayProvider doc={doc} rawContent={rawContent} replayId={replayId} initialFrame={initialFrame} nameMap={cardNameMap}>
            <ReplayBoardContent header={doc.header} />
        </ReplayProvider>
    );
}

export default function ReplayPage() {
    const [doc, setDoc] = useState<SwuPgnDocument | null>(null);
    const [rawContent, setRawContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const replayId = searchParams.get('id');
    const initialFrame = Number(searchParams.get('t')) || 0;

    // On mount, if URL has ?id=, try to load from IndexedDB
    useEffect(() => {
        if (!replayId || doc) return;

        setLoading(true);
        loadReplay(replayId)
            .then((content) => {
                if (content) {
                    const parsed = parse(content);
                    if (parsed.events.length > 0) {
                        setDoc(parsed);
                        setRawContent(content);
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [replayId]);

    // When a file is uploaded, store it and update the URL
    const handleReplayLoaded = async (loaded: SwuPgnDocument, content: string) => {
        setDoc(loaded);
        setRawContent(content);
        try {
            // generateReplayId expects old PascalCase Record<string,string>; pass a shim
            // so the stable id logic (Player1/Player2/Date/Result/Leader1/Leader2) still works.
            const headerShim: Record<string, string> = {
                Player1: loaded.header.p1,
                Player2: loaded.header.p2,
                Date: loaded.header.date,
                Result: loaded.header.result,
                Leader1: loaded.header.p1Leader,
                Leader2: loaded.header.p2Leader,
            };
            const id = await generateReplayId(headerShim, content);
            await storeReplay(id, content, {
                player1: loaded.header.p1,
                player2: loaded.header.p2,
                result: loaded.header.result,
                savedAt: Date.now(),
            });
            router.replace(`/Replay?id=${id}`, { scroll: false });
        } catch {
            // Storage failed, replay still works — just won't survive refresh
        }
    };

    if (doc) {
        return <ReplayBoard doc={doc} rawContent={rawContent} replayId={replayId} initialFrame={initialFrame} />;
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
                        : replayId
                            ? 'Replay not found. Upload the file again.'
                            : 'Upload a game replay file to watch every turn play out in the simulator.'
                    }
                </Typography>
                <FileUpload onReplayLoaded={handleReplayLoaded} />
                <RecentReplays />
            </Card>
        </Box>
    );
}
