import React from 'react';
import { Box, Divider, IconButton } from '@mui/material';
import { GitHub } from '@mui/icons-material';
import { FaDiscord } from 'react-icons/fa6';
import NextLinkMui, { CombinedLinkProps } from './_subcomponents/NextLinkMui/NextLinkMui';
import Drawer from './_subcomponents/Drawer';
import { useUser } from '@/app/_contexts/User.context';

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
    },
}

/**
 * Available links in the app
 */
export const AVAILABLE_MENU_ACTIONS: Record<string, { label: string; href: string }> = {
    UNIMPLEMENTED: {
        label: 'Unimplemented',
        href: '/Unimplemented'
    },
    DECKS: {
        label: 'Decks',
        href: '/DeckPage'
    },
    PREFERENCES: {
        label: 'Preferences',
        href: '/Preferences',
    },
    TERMS: {
        label: 'Terms',
        href: '/Terms'
    },
    MODS: {
        label: 'Mod Page',
        href: '/mod',
    },
    LOGOUT: {
        label: 'Log Out',
        href: '/'
    },
    LOGIN: {
        label: 'Log In',
        href: '/auth',
    }
} as const;

export type MenuAction = keyof typeof AVAILABLE_MENU_ACTIONS;

export const HIDE_LOGIN = process.env.NEXT_PUBLIC_HIDE_LOGIN === 'HIDE';

/**
 * Props to be passed down to NextLinkMui plus:
 * {
 *   prefixDivider: boolean to indicate if the item in the menu should be prefixed by a divider
 * }
 */
export type AdditionalDesktopMenuItemProps = Omit<CombinedLinkProps, 'href'> & { prefixDivider?: boolean }

function filterNulls<T>(arr: Array<T | null>): Array<T> {
    return arr.filter((e): e is Exclude<typeof e, null> => e !== null)
}

const ControlHub: React.FC = () => {
    const { user, logout } = useUser();
    const isMod = true;

    // Links to be rendered on the desktop control hub
    const menuActions: Array<MenuAction> = filterNulls([
        'UNIMPLEMENTED',
        'DECKS',
        'PREFERENCES',
        'TERMS',
        user && isMod ? 'MODS' : null,
        user ? 'LOGOUT' : null,
        !user && !HIDE_LOGIN ? 'LOGIN' : null,
    ]);

    const additionalDesktopMenuProps: Record<MenuAction, AdditionalDesktopMenuItemProps> = {
        MODS: {
            prefixDivider: true,
            sx: {
                color: '#9DD9D2',
                '&:hover': { color: '#7fb9b2' },
            }
        },
        LOGOUT: {
            prefixDivider: true,
            onClick: logout,
        },
    }

    return (
        <Box sx={styles.wrapperContainer}>
            <Box sx={styles.defaultMainContainer}>
                <Box sx={styles.profileBox}>
                    {
                        menuActions.map((menuAction) => {
                            const { href, label } = AVAILABLE_MENU_ACTIONS[menuAction];
                            const { prefixDivider = false, sx, ...otherProps } = additionalDesktopMenuProps[menuAction] || {};
                            return (
                                <React.Fragment key={`desktop-item-${menuAction}`}>
                                    {prefixDivider && (<Divider
                                        orientation="vertical"
                                        flexItem
                                        sx={{ borderColor: '#ffffff4D', mx: 1 }}
                                    />)}
                                    <NextLinkMui href={href} sx={{ ...styles.profileLink, ...sx }} {...otherProps}>
                                        {label}
                                    </NextLinkMui>
                                </React.Fragment>
                            );
                        })
                    }
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
                <Drawer actions={menuActions} />
            </Box>
        </Box>
    );
};

export default ControlHub;
