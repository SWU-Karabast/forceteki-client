import React from 'react';
import { Box, Divider, IconButton, Typography, Drawer, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { GitHub, Menu as MenuIcon } from '@mui/icons-material';
import { FaDiscord } from 'react-icons/fa6';
import NextLinkMui from './_subcomponents/NextLinkMui/NextLinkMui';
import { IControlHubProps } from './ControlHubTypes';
import { useUser } from '@/app/_contexts/User.context';

const ControlHub: React.FC<IControlHubProps> = ({
    sidebarOpen,
    toggleSidebar,
    path,
    user,
    logout,
}) => {
    const hideLogin = process.env.NEXT_PUBLIC_HIDE_LOGIN === 'HIDE';
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { isMod } = useUser();

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

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
            display: { xs: 'none', md: 'flex' },
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
        mobileLink: {
            fontWeight: '600',
            fontSize: '1.2rem',
            color: '#fff',
            textDecoration: 'none',
            display: 'block',
            width: '100%',
        },
        socialIconsBox: {
            display: { xs: 'none', md: 'flex' },
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
        hamburgerIcon: {
            display: { xs: 'flex', md: 'none' },
            color: 'white',
            backgroundColor: 'rgb(0, 0, 0, 0.40)',
            backdropFilter: 'blur(20px)',
            borderRadius: '50%',
            p: '12px',
            marginRight: '10px',
        },
        drawerPaper: {
            backgroundColor: 'rgba(23, 23, 23, 0.95)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            width: 240,
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        }
    }

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ my: 2, fontFamily: 'var(--font-barlow)' }}>
                KARABAST
            </Typography>
            <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <List>
                <ListItem disablePadding>
                    <ListItemButton sx={{ textAlign: 'center' }}>
                        <NextLinkMui href="/Unimplemented" sx={styles.mobileLink}>
                            Unimplemented
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton sx={{ textAlign: 'center' }}>
                        <NextLinkMui href="/DeckPage" sx={styles.mobileLink}>
                            Decks
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton sx={{ textAlign: 'center' }}>
                        <NextLinkMui href="/Preferences" sx={styles.mobileLink}>
                            Preferences
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton sx={{ textAlign: 'center' }}>
                        <NextLinkMui href="/Terms" sx={styles.mobileLink}>
                            Terms
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                {user && isMod && (
                    <ListItem disablePadding>
                        <ListItemButton sx={{ textAlign: 'center' }}>
                            <NextLinkMui href="/mod" sx={{ ...styles.mobileLink, color: '#9DD9D2' }}>
                                Mod Page
                            </NextLinkMui>
                        </ListItemButton>
                    </ListItem>
                )}
                <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)', my: 1 }} />
                {user ? (
                    <ListItem disablePadding>
                        <ListItemButton sx={{ textAlign: 'center' }} onClick={logout}>
                            <ListItemText primary="Log Out" primaryTypographyProps={{ ...styles.mobileLink }} />
                        </ListItemButton>
                    </ListItem>
                ) : (!hideLogin && (
                    <ListItem disablePadding>
                        <ListItemButton sx={{ textAlign: 'center' }}>
                            <NextLinkMui href="/auth" sx={styles.mobileLink}>
                                Log In
                            </NextLinkMui>
                        </ListItemButton>
                    </ListItem>
                ))}
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                    <NextLinkMui href="https://discord.gg/hKRaqHND4v" target="_blank" rel="noopener noreferrer">
                        <IconButton sx={styles.iconButton}><FaDiscord /></IconButton>
                    </NextLinkMui>
                    <NextLinkMui href="https://github.com/SWU-Karabast" target="_blank" rel="noopener noreferrer">
                        <IconButton sx={styles.iconButton}><GitHub /></IconButton>
                    </NextLinkMui>
                </Box>
            </List>
        </Box>
    );

    return (
        <Box sx={styles.wrapperContainer}>
            <Box sx={styles.defaultMainContainer}>
                {/* Desktop Menu */}
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
                    <NextLinkMui href="/Terms" sx={styles.profileLink}>
                        Terms
                    </NextLinkMui>
                    {user && isMod && (
                        <>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: '#ffffff4D', mx: 1 }} />
                            <NextLinkMui href="/mod" sx={{ ...styles.profileLink, color: '#9DD9D2', '&:hover': { color: '#7fb9b2' } }}>
                                Mod Page
                            </NextLinkMui>
                        </>
                    )}
                    {user ? (
                        <>
                            <Divider orientation="vertical" flexItem sx={{ borderColor: '#ffffff4D', mx: 1 }} />
                            <NextLinkMui href="/" onClick={logout} sx={styles.profileLink}>
                                Log Out
                            </NextLinkMui>
                        </>
                    ) : (!hideLogin && (
                        <NextLinkMui href="/auth" sx={styles.profileLink}>
                            Log In
                        </NextLinkMui>
                    ))}
                </Box>
                
                {/* Desktop Social Icons */}
                <Box sx={styles.socialIconsBox}>
                    <NextLinkMui href="https://discord.gg/hKRaqHND4v" target="_blank" rel="noopener noreferrer">
                        <IconButton sx={styles.iconButton}><FaDiscord /></IconButton>
                    </NextLinkMui>
                    <NextLinkMui href="https://github.com/SWU-Karabast" target="_blank" rel="noopener noreferrer">
                        <IconButton sx={styles.iconButton}><GitHub /></IconButton>
                    </NextLinkMui>
                </Box>

                {/* Mobile Menu Icon */}
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={styles.hamburgerIcon}
                >
                    <MenuIcon />
                </IconButton>
            </Box>

            {/* Mobile Drawer */}
            <Drawer
                variant="temporary"
                anchor="right"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{ keepMounted: true }} // Better open performance on mobile.
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': styles.drawerPaper,
                }}
            >
                {drawer}
            </Drawer>
        </Box>
    );
};

export default ControlHub;
