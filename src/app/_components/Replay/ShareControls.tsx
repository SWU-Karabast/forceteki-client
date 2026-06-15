'use client';
import React, { useState } from 'react';
import { Box, IconButton, Tooltip, Snackbar } from '@mui/material';
import { Share, Check, FileDownloadOutlined } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';

/**
 * Client-only sharing: copy a deep-link to the current moment (?id=X&t=N) and
 * download the .swureplay file. The recipient opens the link and loads the file
 * (no server-side replay storage).
 */
const ShareControls: React.FC = () => {
    const { replayId, currentIndex, downloadReplay } = useReplay();
    const [copied, setCopied] = useState(false);
    const [snack, setSnack] = useState('');

    const handleShare = async () => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = replayId
            ? `${origin}/Replay?id=${replayId}&t=${currentIndex}`
            : `${origin}/Replay`;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setSnack(replayId ? 'Link copied — send the replay file too' : 'Link copied');
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setSnack('Could not copy link');
        }
    };

    const btnSx = {
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.6)',
        '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
    };

    return (
        <Box sx={{ position: 'fixed', top: 76, left: 12, zIndex: 1305, display: 'flex', gap: 1 }}>
            <Tooltip title="Copy link to this moment">
                <IconButton onClick={handleShare} sx={btnSx}>
                    {copied ? <Check sx={{ color: 'var(--initiative-blue)' }} /> : <Share />}
                </IconButton>
            </Tooltip>
            <Tooltip title="Download replay file">
                <IconButton onClick={downloadReplay} sx={btnSx}>
                    <FileDownloadOutlined />
                </IconButton>
            </Tooltip>
            <Snackbar
                open={!!snack}
                autoHideDuration={2500}
                onClose={() => setSnack('')}
                message={snack}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            />
        </Box>
    );
};

export default ShareControls;
