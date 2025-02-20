'use client';
import React, { useEffect } from 'react';
import { Grid2 as Grid, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import Players from '../_components/Lobby/Players/Players';
import Deck from '../_components/Lobby/Deck/Deck';
import SetUp from '../_components/Lobby/SetUp/SetUp';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useGame } from '@/app/_contexts/Game.context';
import { Height } from '@mui/icons-material';

const Lobby = () => {
    const pathname = usePathname();
    const isLobbyView = pathname === '/lobby';
    const { lobbyState } = useGame();
    const router = useRouter();

    useEffect(() => {
        if(lobbyState && lobbyState.gameOngoing){
            router.push('/GameBoard');
        }
    }, [lobbyState, router]);

    if(!lobbyState){
        return null;
    }
    // ------------------------STYLES------------------------//

    const styles = {
        containerStyle: {
            height: '100vh',
            overflow: 'hidden',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: '100%',
            padding: '1em',
        },

        setUpGridStyle: {
            justifyContent: 'center',
            height: '100%',
        },

        playersGridStyle: {
            justifyContent: 'center',
            height: '100%',
        },

        deckGridStyle: {
            justifyContent: 'center',
            height: '100%',
        },
    }

    return (
        <Grid container sx={styles.containerStyle} spacing={2}>
            <Grid size={4} sx={styles.setUpGridStyle}>
                <SetUp/>
            </Grid>
            <Grid container size={8} direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ height: '100%' }}>
                <Grid size={{ xs: 3, lg: 3 }} sx={styles.playersGridStyle}>
                    <Players isLobbyView={isLobbyView} />
                </Grid>
                <Grid size={{ xs: 9, lg: 9 }} sx={styles.deckGridStyle}>
                    <Deck />
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Lobby;
