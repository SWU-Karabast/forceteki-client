import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PreferenceButton from './PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';
import { SWU_PGN_MIME, triggerBlobDownload } from '@/app/_utils/downloadBlob';
import { storeReplayContent } from '@/app/_utils/replayHandoff';
import { replayErrorMessage } from '@/app/_utils/swupgnFileIssues';
import { requestGameLog } from '@/app/_utils/gameLogRequest';
import { openLoadingTab, showReplayInTab, type ReplayTab } from '@/app/_utils/replayTab';

function DownloadGameLog() {
    const { sendLobbyMessage } = useGame();
    const [loadingFile, setLoadingFile] = useState(false);
    const [loadingWatch, setLoadingWatch] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /** Run a game-file action with its button loading, showing what went wrong if it fails. */
    const withGameLog = async (action: () => Promise<void>, done: (v: boolean) => void) => {
        done(true);
        setError(null);
        try {
            await action();
        } catch (err) {
            console.error('Failed to handle game file', err);
            setError(replayErrorMessage(err, 'Failed to handle game file'));
        } finally {
            done(false);
        }
    };

    // Straight from a finished game into the viewer. Without this the only route in is the
    // upload box, so a player has to download their own game and upload it back.
    // The viewer opens in a NEW tab: leaving this page would unmount the game and drop its
    // socket without the manual disconnect Return Home sends, which in a Bo3 or a pending
    // rematch reads to the server as a player who vanished.
    const handleWatchReplay = () => {
        const tab = openLoadingTab((url, target) => window.open(url, target) as ReplayTab | null);
        if (!tab) {
            setError('Your browser blocked the new tab. Allow pop-ups for this site, or download the file instead.');
            return;
        }
        withGameLog(() => showReplayInTab(tab, () => requestGameLog(sendLobbyMessage), storeReplayContent), setLoadingWatch);
    };

    const handleDownloadFile = () => {
        withGameLog(async () => {
            const swuPgn = await requestGameLog(sendLobbyMessage);
            const date = new Date().toISOString().slice(0, 10);
            triggerBlobDownload(new Blob([swuPgn], { type: SWU_PGN_MIME }), `game-${date}.swupgn`);
        }, setLoadingFile);
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
            fontSize: '13px',
            fontWeight: 500,
        },
    };

    return (
        <Box sx={styles.contentContainer}>
            <PreferenceButton
                variant={'standard'}
                text={loadingWatch ? 'Loading...' : 'Watch Replay'}
                buttonFnc={handleWatchReplay}
                disabled={loadingWatch || loadingFile}
            />
            <PreferenceButton
                variant={'standard'}
                text={loadingFile ? 'Loading...' : 'Download Game File'}
                buttonFnc={handleDownloadFile}
                disabled={loadingWatch || loadingFile}
            />
            {/* An error is announced and reads as one, not as more helper text. */}
            <Typography sx={error ? { ...styles.typeographyStyle, color: 'error.main' } : styles.typeographyStyle} role={error ? 'alert' : undefined}>
                {error || 'Watch this game in the replay viewer, or download it as a .swupgn file.'}
            </Typography>
        </Box>
    );
}

export default DownloadGameLog;
