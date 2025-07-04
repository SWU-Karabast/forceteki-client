'use client';
import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { Box, Typography } from '@mui/material';
import FoundGame from '@/app/_components/QuickGame/FoundGame/FoundGame';
import { useGame } from '@/app/_contexts/Game.context';
import SearchingForGame from '@/app/_components/QuickGame/SearchingForGame/SearchingForGame';
import { useRouter } from 'next/navigation';
import { s3ImageURL } from '@/app/_utils/s3Utils';

const QuickGame: React.FC = () => {
    const router = useRouter();
    const { lobbyState, gameState, sendMessage } = useGame();
    const handleExit = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    }

    useEffect(() => {
        if (gameState) {
            router.push('/GameBoard');
        } else {
            router.push('/quickGame');
        }
    }, [router, gameState, lobbyState]);

    // ------------------------STYLES------------------------//

    const styles = {
        containerStyle: {
            height: '100vh',
            overflow: 'hidden',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.75rem',
        },
        searchBoxContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
        },
        leaveQueueLink: {
            fontWeight: '600',
            fontSize: '1.2em',
            p: '0.5rem',
            textDecoration: 'none',
            cursor: 'pointer',
            color: '#fff',
            '&:hover': {
                color: '#00ffff',
            },
        },
        leaveQueueContainer: {
            position: 'absolute',
            right: '20px',
            top: '16px',
            display: 'flex',
            height: '48px',
            borderRadius: '50px 0 0 50px',
            backgroundColor: 'rgb(0, 0, 0, 0.40)',
            backdropFilter: 'blur(20px)',
            alignItems: 'center',
            p: '1rem',
        },
    };
    return (
        <Grid container sx={styles.containerStyle}>
            <Grid size={12} height={'100%'}>
                <Box sx={styles.searchBoxContainer}>
                    {lobbyState ? (
                        <FoundGame />
                    ) : (
                        <SearchingForGame />
                    )}
                </Box>
            </Grid>
            {!lobbyState && (
                <Box sx={styles.leaveQueueContainer}>
                    <Box onClick={handleExit} sx={styles.leaveQueueLink}>
                        Leave queue
                    </Box>
                </Box>
            )}
            <Typography variant="body1" sx={styles.disclaimer}>
                Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                Star Wars characters, cards, logos, and art are property of Disney
                and/or Fantasy Flight Games.
            </Typography>
        </Grid>
    );
};

export default QuickGame;