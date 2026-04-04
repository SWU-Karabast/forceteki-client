import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PreferenceButton from './PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';

function DownloadGameLog() {
    const { requestGameLog } = useGame();
    const [loading, setLoading] = useState(false);

    const triggerDownload = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadLog = async () => {
        setLoading(true);
        try {
            const data = await requestGameLog();
            if (data) {
                triggerDownload(data.rawLog, 'game-log.txt', 'text/plain');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPgn = async () => {
        setLoading(true);
        try {
            const data = await requestGameLog();
            if (data) {
                triggerDownload(data.swuPgn, 'game.swupgn', 'text/plain');
            }
        } finally {
            setLoading(false);
        }
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
        <>
            <Box sx={styles.contentContainer}>
                <PreferenceButton
                    variant={'standard'}
                    text={loading ? 'Loading...' : 'Download Game Log'}
                    buttonFnc={handleDownloadLog}
                    disabled={loading}
                />
                <Typography sx={styles.typeographyStyle}>
                    Download the raw game log as a text file.
                </Typography>
            </Box>
            <Box sx={styles.contentContainer}>
                <PreferenceButton
                    variant={'standard'}
                    text={loading ? 'Loading...' : 'Download SWU-PGN'}
                    buttonFnc={handleDownloadPgn}
                    disabled={loading}
                />
                <Typography sx={styles.typeographyStyle}>
                    Download game notation for replay and analysis.
                </Typography>
            </Box>
        </>
    );
}

export default DownloadGameLog;
