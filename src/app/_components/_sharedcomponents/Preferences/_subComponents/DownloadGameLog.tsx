import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PreferenceButton from './PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';

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
    const { gameState } = useGame();
    const [loadingZip, setLoadingZip] = useState(false);

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
        (window as any).__downloadGameFiles = () => {
            handleDownloadZip();
            return 'Download triggered';
        };
        return () => {
            delete (window as any).__downloadGameFiles;
        };
    }, [gameState]);

    const hasZipData = !!gameState?.swuPgn && !!gameState?.swuReplay;

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
    );
}

export default DownloadGameLog;
