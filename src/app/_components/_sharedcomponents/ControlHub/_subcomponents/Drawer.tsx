import React, { useState } from 'react';
import {
    Box,
    Divider,
    IconButton,
    Typography,
    Drawer as MuiDrawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import { GitHub, Menu as MenuIcon, Extension, Style, Settings, Gavel, Logout, Login, AdminPanelSettings } from '@mui/icons-material';
import NextLinkMui from './NextLinkMui/NextLinkMui';
import { FaDiscord } from 'react-icons/fa6';
import { AVAILABLE_MENU_ACTIONS, HIDE_LOGIN, MenuAction } from '../ControlHub';
import { useUser } from '@/app/_contexts/User.context';

const styles = {
    karabastText: {
        mb: 3,
        px: 3,
        fontFamily: 'var(--font-barlow)',
        fontWeight: 'bold',
        letterSpacing: '0.2rem',
        color: '#FFD700',
        textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
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
    hamburgerIcon: {
        display: { xs: 'flex', md: 'none' },
        color: 'white',
        backgroundColor: 'rgb(0, 0, 0, 0.40)',
        backdropFilter: 'blur(20px)',
        borderRadius: '50%',
        p: '12px',
        marginRight: '10px',
    },
    drawer: {
        display: { xs: 'block', md: 'none' },
    },
    drawerPaper: {
        backgroundColor: 'rgba(15, 15, 15, 0.85)',
        backdropFilter: 'blur(15px)',
        color: 'white',
        width: 300,
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
    },
    drawerInnerContainer: {
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        pt: 3, 
        pb: 2 
    },
    iconButton: {
        color: '#fff',
        '&:hover': { color: '#00ffff' },
    },
    divider: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        mx: 2,
        mb: 2
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        flexGrow: 1
    },
    socialContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: 4,
        mt: 4,
        mb: 2
    },
}

type AdditionalMobileMenuProps = { icon: React.ReactElement; color?: string; };

export default function Drawer({ actions }: { actions: MenuAction[] }) {
    const { user, logout } = useUser();
    const [mobileOpen, setMobileOpen] = useState(false);
    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };
    const additionalMobileMenuProps: Record<MenuAction, AdditionalMobileMenuProps> = {
        UNIMPLEMENTED: {
            icon: <Extension />
        },
        DECKS: {
            icon: <Style />
        },
        PREFERENCES: {
            icon: <Settings />
        },
        TERMS: {
            icon: <Gavel />
        },
        MODS: {
            icon: <AdminPanelSettings />,
            color: '#9DD9D2'
        },
        LOGOUT: {
            icon: <Logout />,
            color: '#ff4d4d',
        },
        LOGIN: {
            icon: <Login />
        }
    }
    return <>
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
        {/* Mobile Drawer */}
        <MuiDrawer
            variant="temporary"
            anchor="right"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }} // Better open performance on mobile.
            sx={{
                ...styles.drawer,
                '& .MuiDrawer-paper': styles.drawerPaper,
            }}
        >
            <Box onClick={handleDrawerToggle} sx={styles.drawerInnerContainer}>
                <Typography variant="h5" sx={styles.karabastText}>
                    KARABAST
                </Typography>
                <Divider sx={styles.divider} />
                <List sx={styles.list}>
                    {
                        actions.map(( menuAction, idx) => {
                            const { label, href } = AVAILABLE_MENU_ACTIONS[menuAction];
                            const { icon, ...colorStyles } = additionalMobileMenuProps[menuAction];

                            return (
                                <ListItem disablePadding key={`mobile-item-${idx}`}>
                                    <ListItemButton sx={styles.listItemButton}>
                                        <ListItemIcon sx={{ ...styles.listItemIcon, ...colorStyles }}>{icon}</ListItemIcon>
                                        <NextLinkMui href={href} sx={{ ...styles.mobileLink, ...colorStyles }}>
                                            {label}
                                        </NextLinkMui>
                                    </ListItemButton>
                                </ListItem>
                            );} )
                    }

                    <Box sx={{ mt: 'auto' }}>
                        <Divider sx={styles.divider} />
                        {user ? (
                            <ListItem disablePadding>
                                <ListItemButton sx={styles.listItemButton} onClick={logout}>
                                    <ListItemIcon sx={{ ...styles.listItemIcon, color: '#ff4d4d' }}><Logout /></ListItemIcon>
                                    <ListItemText primary="Log Out" primaryTypographyProps={{ ...styles.mobileLink, color: '#ff4d4d' }} />
                                </ListItemButton>
                            </ListItem>
                        ) : (!HIDE_LOGIN && (
                            <ListItem disablePadding>
                                <ListItemButton sx={styles.listItemButton}>
                                    <ListItemIcon sx={styles.listItemIcon}><Login /></ListItemIcon>
                                    <NextLinkMui href="/auth" sx={styles.mobileLink}>
                                        Log In
                                    </NextLinkMui>
                                </ListItemButton>
                            </ListItem>
                        ))}
                        <Box sx={styles.socialContainer}>
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
        </MuiDrawer>
    </>
}