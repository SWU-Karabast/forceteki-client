import React, { useState } from 'react';
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
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function DownloadGameLog() {
    const { sendLobbyMessage } = useGame();
    const [loadingZip, setLoadingZip] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDownloadZip = () => {
        setLoadingZip(true);
        setError(null);

        sendLobbyMessage(['getGameLog', async (data: { rawLog?: string; swuPgn?: string; swuReplay?: string; error?: string }) => {
            try {
                if (data.error || !data.swuPgn || !data.swuReplay) {
                    setError(data.error || 'Game files not available');
                    return;
                }

                const { zipSync, strToU8 } = await import('fflate');
                const zipped = zipSync({
                    'game.swupgn': strToU8(data.swuPgn),
                    'game.swureplay': strToU8(data.swuReplay),
                });
                const date = new Date().toISOString().split('T')[0];
                const blob = new Blob([zipped], { type: 'application/zip' });
                triggerBlobDownload(blob, `game-${date}.zip`);
            } catch (err) {
                setError('Failed to create zip file');
            } finally {
                setLoadingZip(false);
            }
        }]);
    };

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
                disabled={loadingZip}
            />
            <Typography sx={styles.typeographyStyle}>
                {error || 'Download game notation and replay data as a zip file.'}
            </Typography>
        </Box>
    );
}

export default DownloadGameLog;
