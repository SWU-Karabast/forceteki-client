'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import { getUserPayload } from '@/app/_utils/ServerAndLocalStorageUtils';
import { s3ImageURL } from '@/app/_utils/s3Utils';

const SpectatePage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useUser();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const lobbyId = searchParams.get('lobbyId');

    useEffect(() => {
        const joinAsSpectator = async () => {
            if (!lobbyId) {
                setError('No lobby ID provided');
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/spectate-game`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gameId: lobbyId, // The API calls this `gameId`, but it is actually the lobby id
                        user: getUserPayload(user),
                    }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    // Navigate to the game as a spectator
                    router.push('/GameBoard?spectator=true');
                } else {
                    setError(data.message || 'Failed to join as spectator');
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('Error joining as spectator:', err);
                setError('An error occurred while trying to join the game');
                setIsLoading(false);
            }
        };

        joinAsSpectator();
    }, [lobbyId, user, router]);

    const styles = {
        container: {
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        contentBox: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: '2rem 3rem',
            borderRadius: '8px',
            textAlign: 'center',
        },
        errorText: {
            color: '#ff6b6b',
            marginTop: '1rem',
        },
        loadingText: {
            color: '#fff',
            marginTop: '1rem',
        },
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.contentBox}>
                {isLoading ? (
                    <>
                        <CircularProgress color="primary" />
                        <Typography variant="h6" sx={styles.loadingText}>
                            Joining game as spectator...
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography variant="h5" sx={{ color: '#fff' }}>
                            Unable to Spectate
                        </Typography>
                        <Typography variant="body1" sx={styles.errorText}>
                            {error}
                        </Typography>
                        <Button
                            variant="outlined"
                            sx={{ marginTop: '1rem' }}
                            onClick={() => router.push('/')}
                        >
                            Return to Home
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
};

export default SpectatePage;
