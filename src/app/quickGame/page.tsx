'use client';
import React, { useEffect } from 'react';
import Grid from '@mui/material/Grid2';
import { Box, Typography } from '@mui/material';
import FoundGame from '@/app/_components/QuickGame/FoundGame/FoundGame';
import { useGame } from '@/app/_contexts/Game.context';
import SearchingForGame from '@/app/_components/QuickGame/SearchingForGame/SearchingForGame';
import { useRouter } from 'next/navigation';
import { useCosmetics } from '../_contexts/CosmeticsContext';
import { useUser } from '../_contexts/User.context';
import { QuickGameDarkenBox } from '../_theme/theme-helper';

const QuickGame: React.FC = () => {
    const router = useRouter();
    const { lobbyState, gameState, sendMessage } = useGame();
    const handleExit = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    }
    const { getBackground } = useCosmetics();
    const { user } = useUser();
    const background = getBackground(user?.preferences.cosmetics?.background);

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
            backgroundImage: `url(${background.path})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            '&::before': {},
        },
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.75rem',
            zIndex: 2,
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
            borderRadius: '50px',
            backgroundColor: 'rgb(0, 0, 0, 0.08)',
            backdropFilter: 'blur(20px)',
            alignItems: 'center',
            p: '1rem',
            zIndex: 2,
        },
    };

    if(background?.darkened) {
        styles.containerStyle = {
            ...styles.containerStyle,
            '&::before': QuickGameDarkenBox,
        };
    }
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