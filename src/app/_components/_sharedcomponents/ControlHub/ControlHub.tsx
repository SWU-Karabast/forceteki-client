import React from 'react';
import { Box, Divider, IconButton, Typography } from '@mui/material';
import { Settings, Menu, ArrowBackIosNew, GitHub } from '@mui/icons-material';
import { FaDiscord } from 'react-icons/fa6';
import { useRouter } from 'next/navigation';
import NextLinkMui from './_subcomponents/NextLinkMui/NextLinkMui';
import { IControlHubProps } from './ControlHubTypes';

const ControlHub: React.FC<IControlHubProps> = ({
    sidebarOpen,
    toggleSidebar,
    path,
    user,
    logout,
}) => {
    const router = useRouter();
    const isLobbyView = path === '/lobby';
    const isGameboardView = path === '/gameboard';

    const handleBack = () => {
        if (isLobbyView) {
            router.push('/');
        } else {
            router.back();
        }
    };

    const styles = {
        container: (isLobbyView: boolean, isGameboardView: boolean) => ({
            position: 'absolute',
            top: 10,
            right: isLobbyView || isGameboardView ? 10 : 0,
            display: 'flex',
            alignItems: 'center',
            zIndex: 1,
        }),
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
        <Box sx={styles.container(isLobbyView, isGameboardView)}>
            {isLobbyView ? (
                <>
                    <IconButton>
                        <ArrowBackIosNew
                            sx={styles.backButton}
                            onClick={handleBack}
                        />
                    </IconButton>
                    <Typography variant="h5" sx={styles.exitText}>
                        EXIT
                    </Typography>
                </>
            ) : isGameboardView ? (
                <>
                    <IconButton>
                        <Settings sx={{ color: '#fff' }} />
                    </IconButton>
                    {!sidebarOpen && (
                        <IconButton onClick={toggleSidebar}>
                            <Menu sx={{ color: '#fff' }} />
                        </IconButton>
                    )}
                </>
            ) : (
                <Box sx={styles.defaultMainContainer}>
                    <Box sx={styles.profileBox}>
                        <NextLinkMui href="/Unimplemented" sx={styles.profileLink}>
                            Unimplemented
                        </NextLinkMui>
                        <NextLinkMui href="/DeckPage" sx={styles.profileLink}>
                            Decks
                        </NextLinkMui>
                        {user ? (
                            <>
                                <NextLinkMui href="/profile" sx={styles.profileLink}>
                                    Profile
                                </NextLinkMui>
                                <NextLinkMui href="/Preferences" sx={styles.profileLink}>
                                    Preferences
                                </NextLinkMui>
                                <Divider
                                    orientation="vertical"
                                    flexItem
                                    sx={{ borderColor: '#ffffff4D', mx: 1 }}
                                />
                                <NextLinkMui href="/" onClick={logout} sx={styles.profileLink}>
                                    Log Out
                                </NextLinkMui>
                            </>
                        ) : (
                            // Disable login on Prod for now
                            process.env.NODE_ENV === 'development' ? (
                                <NextLinkMui href="/auth" sx={styles.profileLink}>
                                    Log In
                                </NextLinkMui>

                            ) : null
                        )}
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
            )}
        </Box>
    );
};

export default ControlHub;
