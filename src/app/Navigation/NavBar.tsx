'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Typography, Grid2 as Grid } from '@mui/material';
import ControlHub from '../_components/_sharedcomponents/ControlHub/ControlHub';
import { useUser } from '../_contexts/User.context';
import React from 'react';

const Navbar = () => {
    const { user, logout } = useUser();
    const pathname = usePathname();
    const router = useRouter();
    const handleExit = () => {
        router.push('/');
    }
    // ---------------------- Styles ---------------------- //
    const navbarStyles = {
        container: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1100,
            width: '100%',
        },
        gameLobbyText: {
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '2.6em',
            fontWeight: '600',
            color: '#fff',
            ml: '.5vw',
        },
        lobbyTextStyle:{
            ml:'60px',
            mt:'25px',
            fontSize: '3.0em',
            fontWeight: '600',
            color: 'white',
            alignSelf: 'flex-start',
            mb: '0px',
            cursor: 'pointer',
        }
    };
    return (
        <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            sx={navbarStyles.container}
        >
            {pathname === '/lobby' && (
                <Typography variant="h1" sx={navbarStyles.gameLobbyText}>
                    GAME LOBBY
                </Typography>
            )}
            {pathname === '/Unimplemented' && (
                <Typography sx={navbarStyles.lobbyTextStyle} onClick={handleExit}>KARABAST</Typography>
            )
            }
            <ControlHub
                path={pathname}
                user={user}
                logout={logout}
            />
        </Grid>
    );
};

export default Navbar;
