import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Typography,
    Drawer as MuiDrawer,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
} from '@mui/material';
import { GitHub, Menu as MenuIcon, Close, Logout, Login, AdminPanelSettings, OndemandVideo } from '@mui/icons-material';
import NextLinkMui from './NextLinkMui/NextLinkMui';
import { FaDiscord } from 'react-icons/fa6';
import DecksIcon from '@/assets/custom-icons/decks-icon.svg';
import UnimplementedIcon from '@/assets/custom-icons/unimplemented-icon.svg';
import PreferencesIcon from '@/assets/custom-icons/preferences-icon.svg';
import TermsIcon from '@/assets/custom-icons/terms-icon.svg';
import { AVAILABLE_MENU_ACTIONS, HIDE_LOGIN, MenuAction } from '../ControlHub';
import { useUser } from '@/app/_contexts/User.context';
import NextLink from 'next/link';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';

const styles = {
    logoContainer: {
        borderBottom: '1px solid #2F2F2F',
        mt: 0.5,
        py: 2,
        display: 'flex',
        justifyContent: 'space-between',
        px: 3,
    },
    karabastText: {
        fontFamily: 'var(--font-barlow)',
        fontWeight: '600',
        color: '#FFF',
        fontSize: '35px',
        letterSpacing: '-4%'
    },
    closeIcon: {
        color: '#FFF',

        '& > svg': { fontSize: '30px' }
    },
    mobileLink: {
        fontWeight: '600',
        fontSize: '16px',
        color: '#fff',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
    },
    listItemIcon: {
        color: '#E0E0E0',
        minWidth: 'auto',
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
        gap: 2,
        '&:hover': {
            backgroundColor: '#1B74A7',
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
        '& > svg': { fontSize: '20px' },
    },
    drawer: {
        display: { xs: 'block', md: 'none' },
    },
    drawerPaper: {
        backgroundColor: '#090f18',
        backdropFilter: 'blur(15px)',
        color: 'white',
        width: 280,
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
    },
    drawerInnerContainer: {
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        flexGrow: 1,
        px: 1,
        py: 2,
    },
    socialContainer: {
        borderTop: '1px solid #2F2F2F',
        display: 'flex',
        gap: 2,
        p: 2
    },
    socialIconButton: {
        padding: '12px',
        color: '#fff',
        '& svg': { fontSize: '2rem' },
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
    },
}

type AdditionalMobileMenuProps = {
    icon: React.ReactElement;
    color?: string;
    sx?: SxProps<Theme> | undefined;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export default function Drawer({ actions }: { actions: MenuAction[] }) {
    const { logout } = useUser();
    const [mobileOpen, setMobileOpen] = useState(false);
    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };
    const additionalMobileMenuProps: Record<MenuAction, AdditionalMobileMenuProps> = {
        UNIMPLEMENTED: {
            icon: <UnimplementedIcon />
        },
        DECKS: {
            icon: <DecksIcon />
        },
        REPLAY: {
            icon: <OndemandVideo />
        },
        PREFERENCES: {
            icon: <PreferencesIcon />
        },
        TERMS: {
            icon: <TermsIcon />
        },
        MODS: {
            icon: <AdminPanelSettings />,
            color: '#9DD9D2'
        },
        LOGOUT: {
            icon: <Logout />,
            color: '#ff4d4d',
            sx: {
                marginTop: 'auto'
            },
            onClick: logout
        },
        LOGIN: {
            icon: <Login />,
            sx: {
                marginTop: 'auto'
            }
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
            anchor="right"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }} // Better open performance on mobile.
            sx={{
                ...styles.drawer,
                '& .MuiDrawer-paper': styles.drawerPaper,
            }}
        >
            <Box sx={styles.drawerInnerContainer}>
                <Box sx={styles.logoContainer}>
                    <Typography variant="h5" sx={styles.karabastText}>
                        KARABAST
                    </Typography>
                    <IconButton sx={styles.closeIcon} onClick={handleDrawerToggle}><Close /></IconButton>
                </Box>
                <List sx={styles.list}>
                    {
                        actions.map(( menuAction) => {
                            const { label, href } = AVAILABLE_MENU_ACTIONS[menuAction];
                            const { icon, sx, onClick, ...colorStyles } = additionalMobileMenuProps[menuAction];

                            return (
                                <ListItem disablePadding key={`mobile-item-${menuAction}`} sx={sx}>
                                    <NextLink href={href} passHref legacyBehavior>
                                        <ListItemButton
                                            sx={styles.listItemButton}
                                            component="a"
                                            onClick={(ev) => {
                                                onClick?.(ev);
                                                handleDrawerToggle();
                                            }}>
                                            <ListItemIcon sx={{ ...styles.listItemIcon, ...colorStyles }}>{icon}</ListItemIcon>
                                            <ListItemText primary={label} slotProps={{ primary: { sx: { ...styles.mobileLink, ...colorStyles } } }} />
                                        </ListItemButton>
                                    </NextLink>
                                </ListItem>
                            );} )
                    }
                </List>
                <Box sx={styles.socialContainer}>
                    <NextLinkMui href="https://discord.gg/hKRaqHND4v" target="_blank" rel="noopener noreferrer">
                        <IconButton sx={styles.socialIconButton}><FaDiscord /></IconButton>
                    </NextLinkMui>
                    <NextLinkMui href="https://github.com/SWU-Karabast" target="_blank" rel="noopener noreferrer">
                        <IconButton sx={styles.socialIconButton}><GitHub /></IconButton>
                    </NextLinkMui>
                </Box>
            </Box>
        </MuiDrawer>
    </>
}