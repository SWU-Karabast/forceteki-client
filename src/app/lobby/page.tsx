'use client';
import React, { useState } from 'react';
import { Grid2 as Grid, Typography } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import Players from '../_components/Lobby/Players/Players';
import Deck from '../_components/Lobby/Deck/Deck';
import SetUp from '../_components/Lobby/SetUp/SetUp';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useGame } from '@/app/_contexts/Game.context';

const Lobby = () => {
    const pathname = usePathname();
    const isLobbyView = pathname === '/lobby';
    const { gameState } = useGame();
    const router = useRouter();

    if(gameState){
        router.push('/GameBoard');
    }
    // ------------------------STYLES------------------------//

    const containerStyle = {
        height: '100vh',
        overflow: 'hidden',
        backgroundImage: `url(${s3ImageURL('game/board-background-1.png')})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    const setUpGridStyle = {
        justifyContent: 'center',
        pl: '20px',
        mt: '5px',
    };

    const playersGridStyle = {
        justifyContent: 'center',
        mt: '78px',
    };

    const deckGridStyle = {
        justifyContent: 'center',
        pr: '20px',
        mt: '78px',
    };
    const disclaimer = {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        padding: '1rem',
        textAlign: 'center',
        fontSize: '0.90rem',
    };

    return (
        <Grid container sx={containerStyle}>
            <Grid container size={3} sx={setUpGridStyle}>
                <SetUp
                />
            </Grid>
            <Grid container size={2} sx={playersGridStyle}>
                <Players isLobbyView={isLobbyView} />
            </Grid>
            <Grid container size={7} sx={deckGridStyle}>
                <Deck />
            </Grid>
            <Grid size={12}>
                <Typography variant="body1" sx={disclaimer}>
                    Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                    Star Wars characters, cards, logos, and art are property of Disney
                    and/or Fantasy Flight Games.
                </Typography>
            </Grid>
        </Grid>
    );
};

export default Lobby;
