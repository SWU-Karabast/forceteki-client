'use client';
import React, { useState } from 'react';
import { Box, Grid2 as Grid, Typography } from '@mui/material';
import { ReplayProvider, ParsedReplay } from '@/app/_contexts/Replay.context';
import FileUpload from '@/app/_components/Replay/FileUpload';
import TransportControls from '@/app/_components/Replay/TransportControls';
import OpponentCardTray from '@/app/_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '@/app/_components/Gameboard/Board/Board';
import PlayerCardTray from '@/app/_components/Gameboard/PlayerCardTray/PlayerCardTray';
import { s3ImageURL } from '@/app/_utils/s3Utils';

function ReplayHeader({ header }: { header: Record<string, string> }) {
    const player1 = header.Player1 || 'Player 1';
    const player2 = header.Player2 || 'Player 2';
    const leader1 = header.Leader1 || '';
    const leader2 = header.Leader2 || '';
    const result = header.Result || '';

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 3,
                py: 0.5,
                px: 2,
                backgroundColor: 'rgba(0,0,0,0.6)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                zIndex: 10,
            }}
        >
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {player1}
                </Typography>
                {leader1 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {leader1}
                    </Typography>
                )}
            </Box>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                vs
            </Typography>
            <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {player2}
                </Typography>
                {leader2 && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {leader2}
                    </Typography>
                )}
            </Box>
            {result && (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', ml: 2 }}>
                    {result}
                </Typography>
            )}
        </Box>
    );
}

function ReplayBoard({ replay }: { replay: ParsedReplay }) {
    return (
        <ReplayProvider replay={replay}>
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
                    <ReplayHeader header={replay.header} />
                    <Box sx={{ height: '15dvh' }}>
                        <OpponentCardTray
                            trayPlayer="opponent"
                            preferenceToggle={() => {}}
                        />
                    </Box>
                    <Box sx={{ height: '62dvh', position: 'relative', zIndex: 2 }}>
                        <Board sidebarOpen={false} />
                    </Box>
                    <Box sx={{ height: '18dvh', pb: '60px' }}>
                        <PlayerCardTray
                            trayPlayer="player"
                            toggleSidebar={() => {}}
                        />
                    </Box>
                </Box>
            </Grid>
            <TransportControls />
        </ReplayProvider>
    );
}

export default function ReplayPage() {
    const [replay, setReplay] = useState<ParsedReplay | null>(null);

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
                Upload a game replay file to watch the game play out
            </Typography>
            <FileUpload onReplayLoaded={setReplay} />
        </Box>
    );
}
