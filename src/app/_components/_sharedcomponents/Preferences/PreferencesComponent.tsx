import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import VerticalTabs from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VerticalTabs';
import { IPreferenceProps } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

const PreferencesComponent: React.FC<IPreferenceProps> = ({
    isPreferenceOpen,
    sidebarOpen,
    preferenceToggle,
    tabs = [],
    title,
    variant = 'gameBoard',
    subtitle = undefined,
    initialTab,
}) => {
    const [attemptingClose, setAttemptingClose] = useState(false);
    const [closePreferencesHandler, setClosePreferencesHandler] = useState<() => void>(() => () => undefined);

    // ------------------------STYLES------------------------//
    const styles = {
        containerStyle:{
            display: isPreferenceOpen ? 'block' : 'none',
            position: variant === 'homePage' ? { xs: 'relative', md: 'absolute' } : 'absolute',
            width: sidebarOpen ? { xs: '100%', md: 'calc(100% - min(20%, 280px))' } : '100%',
            '@media (orientation: landscape) and (max-width: 932px)': {
                width: sidebarOpen ? 'calc(100% - min(20%, 280px))' : '100%',
            },
            height: variant === 'homePage' ? { xs: 'auto', md: '100%' } : '100%',
            backgroundColor: variant ==='gameBoard' ? 'rgba(0, 0, 0, 0.5)' : 'none',
            zIndex: variant === 'homePage' ? 1 : 999,
            padding: variant === 'homePage' ? { xs: '7rem 2rem', md:'7rem' } : '2rem',
            maxWidth: { xs: '100vw', md: '100%' },
        },
        overlayStyle:{
            display: isPreferenceOpen ? 'flex' : 'none',
            flexDirection: 'column',
            padding: '30px',
            maxWidth: '105em',
            // nothing should display outside the popup. use inner scrolls to display the content
            overflow: 'hidden',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '3px solid transparent',
            backdropFilter: 'blur(30px)',
            borderRadius:'15px',
            ...(variant === 'homePage' ? {
                width: '100%',
                justifySelf:'center',
                height: { xs: 'auto', md: '81vh' },
            } : {
                borderColor: '#30434B',
                height: '100%',
                width: '100%',
            })
        },
        headerBox:{
            height: '3rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
        },
        closeButton:{
            position: 'absolute',
            right:'30px',
            top:'30px',
        },
        tabContainer:{
            flex: 1,
            minHeight: 0,
            background: 'transparent',
        },
        titleContainer:{
            width:'6rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: '7%',
            minHeight:'3rem',
        },
    }

    const attemptCloseFromBoard = () => {
        setClosePreferencesHandler(() => () => closePreferences());
        setAttemptingClose(true);
    }

    const closePreferences = () => {
        setAttemptingClose(false);
        preferenceToggle?.();
    };

    const cancelClosePreferences = () => {
        setAttemptingClose(false);
    }

    return (
        <>
            <Box sx={styles.containerStyle}>
                <Box sx={styles.overlayStyle}>
                    {title && (
                        <Box sx={styles.headerBox}>
                            <Typography variant="h1">{title}</Typography>
                            <Typography variant="h2">{subtitle}</Typography>
                        </Box>
                    )}
                    {variant === 'gameBoard' && (
                        <CloseOutlined onClick={attemptCloseFromBoard} sx={{ ...styles.closeButton, cursor:'pointer' }}/>
                    )}
                    <Box sx={styles.tabContainer}>
                        <VerticalTabs tabs={tabs} variant={variant} attemptingClose={attemptingClose} closeHandler={closePreferencesHandler} cancelCloseHandler={cancelClosePreferences} initialTab={initialTab} />
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default PreferencesComponent;
