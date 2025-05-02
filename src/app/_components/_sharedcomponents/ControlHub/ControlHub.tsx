import React from 'react';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import { GitHub } from '@mui/icons-material';
import { FaDiscord } from 'react-icons/fa6';
import NextLinkMui from './_subcomponents/NextLinkMui/NextLinkMui';
import { IControlHubProps } from './ControlHubTypes';

const ControlHub: React.FC<IControlHubProps> = ({
    sidebarOpen,
    toggleSidebar,
    path,
    user,
    logout,
}) => {
    const hideLogin = process.env.NEXT_PUBLIC_HIDE_LOGIN === 'HIDE';
    const isDev = process.env.NODE_ENV === 'development';
    const styles = {
        wrapperContainer:{
            position: 'absolute',
            top: 10,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
        },
        defaultMainContainer: {
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            ml: '1rem',
        },
        backButton: {
            color: '#fff',
            mt: '.5vh',
            fontWeight: '600',
            fontSize: '1.5rem',
        },
        exitText: {
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: '600',
            color: '#fff',
            mt: '.5vh',
            mr: '.5vw',
        },
        profileBox: {
            display: 'flex',
            borderRadius: '50px',
            backgroundColor: 'rgb(0, 0, 0, 0.40)',
            backdropFilter: 'blur(20px)',
            height: '48px',
            justifyContent: 'space-around',
            alignItems: 'center',
            alignContent: 'center',
            p: '0.5rem 1rem',
        },
        profileLink: {
            fontWeight: '600',
            fontSize: '1.2em',
            p: '0.5rem',
            textDecoration: 'none',
            color: '#fff',
            '&:hover': {
                color: '#00ffff',
            },
        },
        socialIconsBox: {
            display: 'flex',
            height: '48px',
            borderRadius: '50px 0 0 50px',
            backgroundColor: 'rgb(0, 0, 0, 0.40)',
            backdropFilter: 'blur(20px)',
            alignItems: 'center',
            p: '1rem',
        },
        iconButton: {
            color: '#fff',
            '&:hover': { color: '#00ffff' },
        },

    }


    return (
        <Box sx={styles.wrapperContainer}>
            <Box sx={styles.defaultMainContainer}>
                <Box sx={styles.profileBox}>
                    <NextLinkMui href="/Unimplemented" sx={styles.profileLink}>
                        Unimplemented
                    </NextLinkMui>
                    <NextLinkMui href="/DeckPage" sx={styles.profileLink}>
                        Decks
                    </NextLinkMui>
                    <NextLinkMui href="/Preferences" sx={styles.profileLink}>
                        Preferences
                    </NextLinkMui>
                    {(user && !hideLogin && isDev) ? (
                        <>
                            <Divider
                                orientation="vertical"
                                flexItem
                                sx={{ borderColor: '#ffffff4D', mx: 1 }}
                            />
                            <NextLinkMui href="/" onClick={logout} sx={styles.profileLink}>
                                Log Out
                            </NextLinkMui>
                        </>
                    ) : (!hideLogin && isDev) ? (
                        // Disable login on Prod for now
                        <NextLinkMui href="/auth" sx={styles.profileLink}>
                            Log In
                        </NextLinkMui>
                    ): null}
                </Box>
                <Box sx={styles.socialIconsBox}>
                    <NextLinkMui
                        href="https://discord.gg/hKRaqHND4v"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconButton sx={styles.iconButton}>
                            <FaDiscord />
                        </IconButton>
                    </NextLinkMui>
                    <NextLinkMui
                        href="https://github.com/SWU-Karabast"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <IconButton sx={styles.iconButton}>
                            <GitHub />
                        </IconButton>
                    </NextLinkMui>
                </Box>
            </Box>
            <Box sx={{ mt: 1 }}>
                <Box sx={styles.socialIconsBox}>
                    <Typography>
                        Looking for <NextLinkMui sx={{ color: 'white', textDecorationColor: 'white' }} href="https://petranaki.net/Arena/MainMenu.php">original Karabast</NextLinkMui>?
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default ControlHub;
