'use client';
import React from 'react';
import Grid from '@mui/material/Grid2';
import { Box, Typography } from '@mui/material';
import FoundGame from '@/app/_components/QuickGame/FoundGame/FoundGame';
import { useGame } from '@/app/_contexts/Game.context';
import NextLinkMui from '@/app/_components/_sharedcomponents/ControlHub/_subcomponents/NextLinkMui/NextLinkMui';
import SearchingForGame from '@/app/_components/QuickGame/SearchingForGame/SearchingForGame';

const QuickGame: React.FC = () => {
    const { lobbyState } = useGame();

    // ------------------------STYLES------------------------//

    const styles = {
        containerStyle: {
            height: '100vh',
            overflow: 'hidden',
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
                    <NextLinkMui href="/" sx={styles.leaveQueueLink}>
                        Leave queue
                    </NextLinkMui>
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