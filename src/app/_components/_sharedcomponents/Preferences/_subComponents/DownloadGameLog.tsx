import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PreferenceButton from './PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';
import { triggerBlobDownload } from '@/app/_utils/downloadBlob';
import { storeReplayContent } from '@/app/_utils/replayHandoff';

function DownloadGameLog() {
    const { sendLobbyMessage } = useGame();
    const router = useRouter();
    const [loadingZip, setLoadingZip] = useState(false);
    const [loadingWatch, setLoadingWatch] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** Fetch this game's .swupgn from the lobby and hand it to `fn`. */
    const withGameLog = (fn: (swuPgn: string) => void | Promise<void>, done: (v: boolean) => void) => {
        done(true);
        setError(null);
        sendLobbyMessage(['getGameLog', async (data: { swuPgnFile?: string; error?: string }) => {
            try {
                if (data.error || !data.swuPgnFile) {
                    setError(data.error || 'Game files not available');
                    return;
                }
                await fn(data.swuPgnFile);
            } catch (err) {
                console.error('Failed to handle game file', err);
                setError(err instanceof Error ? err.message : 'Failed to handle game file');
            } finally {
                done(false);
            }
        }]);
    };

    // Straight from a finished game into the viewer. Without this the only route in is the
    // upload box, so a player has to download their own game and upload it back.
    const handleWatchReplay = () => {
        withGameLog(async (swuPgn) => {
            const { id } = await storeReplayContent(swuPgn);
            router.push(`/Replay?id=${id}`);
        }, setLoadingWatch);
    };

    const handleDownloadZip = () => {
        withGameLog((swuPgn) => {
            const date = new Date().toISOString().slice(0, 10);
            triggerBlobDownload(new Blob([swuPgn], { type: 'text/plain' }), `game-${date}.swupgn`);
        }, setLoadingZip);
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
                text={loadingWatch ? 'Loading...' : 'Watch Replay'}
                buttonFnc={handleWatchReplay}
                disabled={loadingWatch || loadingZip}
            />
            <PreferenceButton
                variant={'standard'}
                text={loadingZip ? 'Loading...' : 'Download Game Files'}
                buttonFnc={handleDownloadZip}
                disabled={loadingWatch || loadingZip}
            />
            <Typography sx={styles.typeographyStyle}>
                {error || 'Watch this game in the replay viewer, or download it as a .swupgn file.'}
            </Typography>
        </Box>
    );
}

export default DownloadGameLog;
