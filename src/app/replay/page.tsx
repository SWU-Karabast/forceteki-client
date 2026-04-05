'use client';
import React, { useState, useEffect } from 'react';
import { Box, Grid2 as Grid, Typography, IconButton } from '@mui/material';
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
    const leader1 = header.Leader1 || '';
    const leader2 = header.Leader2 || '';
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
                    color: isP1Winner ? '#4fc3f7' : 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    textShadow: isP1Winner ? '0 0 10px rgba(79,195,247,0.5)' : 'none',
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
                    color: isP2Winner ? '#4fc3f7' : 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    textShadow: isP2Winner ? '0 0 10px rgba(79,195,247,0.5)' : 'none',
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
                    backgroundColor: 'rgba(79,195,247,0.15)',
                    border: '1px solid rgba(79,195,247,0.3)',
                }}>
                    <Typography variant="body2" sx={{
                        color: '#4fc3f7',
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
            <Grid container sx={{ height: '100dvh', overflow: 'hidden' }}>
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
                    <Box sx={{ height: '15dvh' }}>
                        <OpponentCardTray
                            trayPlayer={getOpponent(connectedPlayer)}
                            preferenceToggle={() => {}}
                        />
                    </Box>
                    <Box sx={{ height: '65dvh', position: 'relative', zIndex: 2 }}>
                        <Board sidebarOpen={false} />
                    </Box>
                    <Box sx={{ height: '15dvh', pb: '60px' }}>
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
            const id = await generateReplayId(parsed.header);
            await storeReplay(id, rawContent);
            router.replace(`/replay?id=${id}`, { scroll: false });
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
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')}?v=2)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                gap: 3,
            }}
        >
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                Replay Viewer
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
                {loading
                    ? 'Loading replay...'
                    : replayId
                        ? 'Replay not found. Upload the file again.'
                        : 'Upload a game replay file to watch the game play out'
                }
            </Typography>
            <FileUpload onReplayLoaded={handleReplayLoaded} />
        </Box>
    );
}
