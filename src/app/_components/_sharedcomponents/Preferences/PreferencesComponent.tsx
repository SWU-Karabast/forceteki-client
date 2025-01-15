import React from 'react';
import { Box, Typography } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import VerticalTabs from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VerticalTabs';
import { IPreferenceProps } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

const PreferencesComponent: React.FC<IPreferenceProps> = ({
    isPreferenceOpen,
    preferenceToggle,
    tabs = [],
    title,
    variant = 'gameBoard',
    subtitle = undefined,
}) => {
    // ------------------------STYLES------------------------//
    const styles = {
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
                width: '95vw',
                justifySelf:'center',
                height: '81vh',
            } : {
                borderColor: '#30434B',
                height: '90vh',
                transform: 'translate(-50%, -50%)',
                top: '50%',
                left: '50%',
                position: 'absolute',
                width: '90vw',
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
        }
    }
    return (
        <Box sx={styles.overlayStyle}>
            {title && (
                <Box sx={styles.headerBox}>
                    <Typography variant="h1">{title}</Typography>
                    <Typography variant="h2">{subtitle}</Typography>
                </Box>
            )}
            {variant === 'gameBoard' && (
                <CloseOutlined onClick={preferenceToggle} sx={{ ...styles.closeButton, cursor:'pointer' }}/>
            )}
            <Box sx={styles.tabContainer}>
                <VerticalTabs tabs={tabs} variant={variant}/>
            </Box>
        </Box>
    );
};

export default PreferencesComponent;