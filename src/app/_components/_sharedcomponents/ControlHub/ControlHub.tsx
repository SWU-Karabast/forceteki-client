import React from 'react';
import { Box, Divider, IconButton, Typography, Drawer, List, ListItem, ListItemButton, ListItemText, ListItemIcon } from '@mui/material';
import { GitHub, Menu as MenuIcon, Extension, Style, Settings, Gavel, Logout, Login, AdminPanelSettings } from '@mui/icons-material';
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
            fontSize: '1.8rem',
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
        },
        listItemIcon: {
            color: '#E0E0E0',
            minWidth: '45px',
            '& svg': {
                fontSize: '2.2rem',
            }
        },
        listItemButton: {
            textAlign: 'left',
            py: 2.5,
            px: 3,
            borderRadius: '12px',
            mx: 1,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                transform: 'translateX(8px)',
            },
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
            backgroundColor: 'rgba(15, 15, 15, 0.85)',
            backdropFilter: 'blur(15px)',
            color: 'white',
            width: 240,
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
        }
    }

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ height: '100%', display: 'flex', flexDirection: 'column', pt: 3, pb: 2 }}>
            <Typography variant="h5" sx={{ 
                mb: 3, 
                px: 3,
                fontFamily: 'var(--font-barlow)', 
                fontWeight: 'bold', 
                letterSpacing: '0.2rem',
                color: '#FFD700',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
            }}>
                KARABAST
            </Typography>
            <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)', mx: 2, mb: 2 }} />
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
                <ListItem disablePadding>
                    <ListItemButton sx={styles.listItemButton}>
                        <ListItemIcon sx={styles.listItemIcon}><Extension /></ListItemIcon>
                        <NextLinkMui href="/Unimplemented" sx={styles.mobileLink}>
                            Unimplemented
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton sx={styles.listItemButton}>
                        <ListItemIcon sx={styles.listItemIcon}><Style /></ListItemIcon>
                        <NextLinkMui href="/DeckPage" sx={styles.mobileLink}>
                            Decks
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton sx={styles.listItemButton}>
                        <ListItemIcon sx={styles.listItemIcon}><Settings /></ListItemIcon>
                        <NextLinkMui href="/Preferences" sx={styles.mobileLink}>
                            Preferences
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                    <ListItemButton sx={styles.listItemButton}>
                        <ListItemIcon sx={styles.listItemIcon}><Gavel /></ListItemIcon>
                        <NextLinkMui href="/Terms" sx={styles.mobileLink}>
                            Terms
                        </NextLinkMui>
                    </ListItemButton>
                </ListItem>
                {user && isMod && (
                    <ListItem disablePadding>
                        <ListItemButton sx={styles.listItemButton}>
                            <ListItemIcon sx={{ ...styles.listItemIcon, color: '#9DD9D2' }}><AdminPanelSettings /></ListItemIcon>
                            <NextLinkMui href="/mod" sx={{ ...styles.mobileLink, color: '#9DD9D2' }}>
                                Mod Page
                            </NextLinkMui>
                        </ListItemButton>
                    </ListItem>
                )}
                
                <Box sx={{ mt: 'auto' }}>
                    <Divider sx={{ backgroundColor: 'rgba(255,255,255,0.1)', mx: 2, my: 2 }} />
                    {user ? (
                        <ListItem disablePadding>
                            <ListItemButton sx={styles.listItemButton} onClick={logout}>
                                <ListItemIcon sx={{ ...styles.listItemIcon, color: '#ff4d4d' }}><Logout /></ListItemIcon>
                                <ListItemText primary="Log Out" primaryTypographyProps={{ ...styles.mobileLink, color: '#ff4d4d' }} />
                            </ListItemButton>
                        </ListItem>
                    ) : (!hideLogin && (
                        <ListItem disablePadding>
                            <ListItemButton sx={styles.listItemButton}>
                                <ListItemIcon sx={styles.listItemIcon}><Login /></ListItemIcon>
                                <NextLinkMui href="/auth" sx={styles.mobileLink}>
                                    Log In
                                </NextLinkMui>
                            </ListItemButton>
                        </ListItem>
                    ))}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 4, mb: 2 }}>
                        <NextLinkMui href="https://discord.gg/hKRaqHND4v" target="_blank" rel="noopener noreferrer">
                            <IconButton sx={{ ...styles.iconButton, '& svg': { fontSize: '4rem' } }}><FaDiscord /></IconButton>
                        </NextLinkMui>
                        <NextLinkMui href="https://github.com/SWU-Karabast" target="_blank" rel="noopener noreferrer">
                            <IconButton sx={{ ...styles.iconButton, '& svg': { fontSize: '4rem' } }}><GitHub /></IconButton>
                        </NextLinkMui>
                    </Box>
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
