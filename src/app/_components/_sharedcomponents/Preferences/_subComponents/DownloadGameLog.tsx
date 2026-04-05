import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PreferenceButton from './PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';
import { generateHumanNotation } from '@/app/_utils/gameLogGenerator';

function triggerDownload(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function DownloadGameLog() {
    const { gameMessages, gameState, connectedPlayer } = useGame();
    const [loadingLog, setLoadingLog] = useState(false);
    const [loadingPgn, setLoadingPgn] = useState(false);

    const getPlayerNames = (): { p1Name: string; p2Name: string } | null => {
        if (!gameState?.players) return null;
        const playerIds = Object.keys(gameState.players);
        if (playerIds.length < 2) return null;
        return {
            p1Name: gameState.players[playerIds[0]].name,
            p2Name: gameState.players[playerIds[1]].name,
        };
    };

    const handleDownloadLog = () => {
        // Prefer server-generated raw game log (includes subtitles)
        if (gameState?.rawGameLog) {
            triggerDownload(gameState.rawGameLog, 'game-log.txt', 'text/plain');
            return;
        }

        // Fall back to client-side generation
        const names = getPlayerNames();
        if (!names || !gameMessages.length) return;

        setLoadingLog(true);
        try {
            const rawLog = generateHumanNotation(gameMessages, names.p1Name, names.p2Name);
            triggerDownload(rawLog, 'game-log.txt', 'text/plain');
        } finally {
            setLoadingLog(false);
        }
    };

    const handleDownloadPgn = () => {
        if (!gameState?.swuPgn) return;

        setLoadingPgn(true);
        try {
            triggerDownload(gameState.swuPgn, 'game.swupgn', 'text/plain');
        } finally {
            setLoadingPgn(false);
        }
    };

    // Expose console helpers for manual downloads
    useEffect(() => {
        (window as any).__downloadGameLog = () => {
            handleDownloadLog();
            return 'Download triggered';
        };
        (window as any).__downloadSwuPgn = () => {
            handleDownloadPgn();
            return 'Download triggered';
        };
        return () => {
            delete (window as any).__downloadGameLog;
            delete (window as any).__downloadSwuPgn;
        };
    }, [gameMessages, gameState, connectedPlayer]);

    const hasPgnData = !!gameState?.swuPgn;
    const hasLogData = !!gameState?.rawGameLog || gameMessages.length > 0;

    const styles = {
        contentContainer: {
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            mb: '20px',
        },
        typeographyStyle: {
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
    };

    return (
        <>
            <Box sx={styles.contentContainer}>
                <PreferenceButton
                    variant={'standard'}
                    text={loadingLog ? 'Loading...' : 'Download Game Log'}
                    buttonFnc={handleDownloadLog}
                    disabled={loadingLog || !hasLogData}
                />
                <Typography sx={styles.typeographyStyle}>
                    Download the raw game log as a text file.
                </Typography>
            </Box>
            <Box sx={styles.contentContainer}>
                <PreferenceButton
                    variant={'standard'}
                    text={loadingPgn ? 'Loading...' : 'Download SWU-PGN'}
                    buttonFnc={handleDownloadPgn}
                    disabled={loadingPgn || !hasPgnData}
                />
                <Typography sx={styles.typeographyStyle}>
                    Download game notation for replay and analysis.
                </Typography>
            </Box>
        </>
    );
}

export default DownloadGameLog;
