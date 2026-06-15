'use client';
import React, { useState, useEffect } from 'react';
import { Box, Card, Grid, Typography, IconButton } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import { useRouter, useSearchParams } from 'next/navigation';
import { ReplayProvider, ParsedReplay, useReplay } from '@/app/_contexts/Replay.context';
import FileUpload from '@/app/_components/Replay/FileUpload';
import TransportControls from '@/app/_components/Replay/TransportControls';
import OpponentCardTray from '@/app/_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '@/app/_components/Gameboard/Board/Board';
import PlayerCardTray from '@/app/_components/Gameboard/PlayerCardTray/PlayerCardTray';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import PopupShell from '@/app/_components/_sharedcomponents/Popup/Popup';
import { parseReplayFile } from '@/app/_utils/replayParser';
import { generateReplayId, storeReplay, loadReplay } from '@/app/_utils/replayStorage';

function formatResult(result: string): string {
    return result.replace(/\bP1\b/g, 'Player 1').replace(/\bP2\b/g, 'Player 2');
}

function ReplayHeader({ header }: { header: Record<string, string> }) {
    const router = useRouter();
    const player1 = header.Player1 || 'Player 1';
    const player2 = header.Player2 || 'Player 2';
    const leader1 = header.P1Leader || header.Leader1 || '';
    const leader2 = header.P2Leader || header.Leader2 || '';
    const result = header.Result || '';
    const formattedResult = formatResult(result);

    const isP1Winner = result.includes('P1');
    const isP2Winner = result.includes('P2');

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

function ReplayBoardContent({ header }: { header: Record<string, string> }) {
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
            <TransportControls />
        </>
    );
}

function ReplayBoard({ replay }: { replay: ParsedReplay }) {
    return (
        <ReplayProvider replay={replay}>
            <ReplayBoardContent header={replay.header} />
        </ReplayProvider>
    );
}

export default function ReplayPage() {
    const [replay, setReplay] = useState<ParsedReplay | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const replayId = searchParams.get('id');

    // On mount, if URL has ?id=, try to load from IndexedDB
    useEffect(() => {
        if (!replayId || replay) return;

        setLoading(true);
        loadReplay(replayId)
            .then((rawContent) => {
                if (rawContent) {
                    const parsed = parseReplayFile(rawContent);
                    if (parsed.snapshots.length > 0) {
                        setReplay(parsed);
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [replayId]);

    // When a file is uploaded, store it and update the URL
    const handleReplayLoaded = async (parsed: ParsedReplay, rawContent: string) => {
        setReplay(parsed);
        try {
            const id = await generateReplayId(parsed.header, rawContent);
            await storeReplay(id, rawContent);
            router.replace(`/Replay?id=${id}`, { scroll: false });
        } catch {
            // Storage failed, replay still works — just won't survive refresh
        }
    };

    if (replay) {
        return <ReplayBoard replay={replay} />;
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
            </Card>
        </Box>
    );
}
