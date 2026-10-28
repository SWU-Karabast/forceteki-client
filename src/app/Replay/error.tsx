'use client';
import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

interface IReplayErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * The /Replay route's error boundary. A replay is an uploaded file, so a field no check
 * anticipated can still throw while rendering; without this the whole page goes blank.
 * The message is generic: the error text may quote the file.
 */
const ReplayError: React.FC<IReplayErrorProps> = ({ reset }) => {
    const router = useRouter();

    return (
        <Box sx={styles.container}>
            <Typography variant="h3" sx={styles.title}>This replay could not be shown</Typography>
            <Typography variant="body1" sx={styles.body}>
                Something in the file is shaped in a way the viewer did not expect. Try again, or open a different replay.
            </Typography>
            <Box sx={styles.actions}>
                <Button variant="contained" onClick={reset}>Try again</Button>
                <Button
                    variant="outlined"
                    onClick={() => {
                        router.replace('/Replay');
                        reset();
                    }}
                >
                    Open another replay
                </Button>
            </Box>
        </Box>
    );
};

export default ReplayError;

// ----------------Styles----------------//
const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        px: 2,
        textAlign: 'center',
    },
    title: {
        color: 'white',
    },
    body: {
        color: 'rgba(255,255,255,0.75)',
        maxWidth: 480,
    },
    actions: {
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
};
