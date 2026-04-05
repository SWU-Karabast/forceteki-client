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

function triggerBlobDownload(blob: Blob, filename: string) {
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
    const [loadingZip, setLoadingZip] = useState(false);

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
        if (gameState?.rawGameLog) {
            triggerDownload(gameState.rawGameLog, 'game-log.txt', 'text/plain');
            return;
        }
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

    const handleDownloadZip = async () => {
        if (!gameState?.swuPgn || !gameState?.swuReplay) return;
        setLoadingZip(true);
        try {
            const { zipSync, strToU8 } = await import('fflate');
            const zipped = zipSync({
                'game.swupgn': strToU8(gameState.swuPgn),
                'game.swureplay': strToU8(gameState.swuReplay),
            });
            const date = new Date().toISOString().split('T')[0];
            const blob = new Blob([zipped], { type: 'application/zip' });
            triggerBlobDownload(blob, `game-${date}.zip`);
        } finally {
            setLoadingZip(false);
        }
    };

    useEffect(() => {
        (window as any).__downloadGameLog = () => {
            handleDownloadLog();
            return 'Download triggered';
        };
        (window as any).__downloadGameFiles = () => {
            handleDownloadZip();
            return 'Download triggered';
        };
        return () => {
            delete (window as any).__downloadGameLog;
            delete (window as any).__downloadGameFiles;
        };
    }, [gameMessages, gameState, connectedPlayer]);

    const hasZipData = !!gameState?.swuPgn && !!gameState?.swuReplay;
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
                    text={loadingZip ? 'Loading...' : 'Download Game Files'}
                    buttonFnc={handleDownloadZip}
                    disabled={loadingZip || !hasZipData}
                />
                <Typography sx={styles.typeographyStyle}>
                    Download game notation and replay data as a zip file.
                </Typography>
            </Box>
        </>
    );
}

export default DownloadGameLog;
