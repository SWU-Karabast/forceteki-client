import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import VerticalTabs from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VerticalTabs';
import { IPreferenceProps } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';

const PreferencesComponent: React.FC<IPreferenceProps> = ({
    isPreferenceOpen,
    sidebarOpen,
    preferenceToggle,
    tabs = [],
    title,
    variant = 'gameBoard',
    subtitle = undefined,
}) => {
    const [attemptingClose, setAttemptingClose] = useState(false);

    const router = useRouter();
    const handleBackButton = () => {
        router.push('/');
    };

    // ------------------------STYLES------------------------//
    const styles = {
        containerStyle:{
            display: isPreferenceOpen ? 'block' : 'none',
            position: 'absolute',
            width: sidebarOpen ? 'calc(100% - min(20%, 280px))' : '100%',
            height: '100%',
            backgroundColor: variant ==='gameBoard' ? 'rgba(0, 0, 0, 0.5)' : 'none',
            zIndex: variant === 'homePage' ? 1 : 999,
            padding: variant === 'homePage' ? '7rem' : '2rem',
        },
        overlayStyle:{
            display: isPreferenceOpen ? 'block' : 'none',
            padding: '30px',
            maxWidth: '105em',
            maxHeight: '65em',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '3px solid transparent',
            backdropFilter: 'blur(30px)',
            borderRadius:'15px',
            ...(variant === 'homePage' ? {
                width: '100%',
                justifySelf:'center',
                height: '81vh',
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
            height:'30rem',
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

    const attemptClose = () => {
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
                    {variant === 'homePage' && (
                        <Box sx={styles.titleContainer}>
                            <PreferenceButton variant={'standard'} buttonFnc={handleBackButton}/>
                        </Box>
                    )}
                    {title && (
                        <Box sx={styles.headerBox}>
                            <Typography variant="h1">{title}</Typography>
                            <Typography variant="h2">{subtitle}</Typography>
                        </Box>
                    )}
                    {variant === 'gameBoard' && (
                        <CloseOutlined onClick={attemptClose} sx={{ ...styles.closeButton, cursor:'pointer' }}/>
                    )}
                    <Box sx={styles.tabContainer}>
                        <VerticalTabs tabs={tabs} variant={variant} attemptingClose={attemptingClose} closeHandler={closePreferences} cancelCloseHandler={cancelClosePreferences} />
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default PreferencesComponent;