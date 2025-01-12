import React from 'react';
import { Box, Typography } from '@mui/material';
import { CloseOutlined } from '@mui/icons-material';
import VerticalTabs from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VerticalTabs';
import { IPreferenceProps } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

const Preferences: React.FC<IPreferenceProps> = ({
    isPreferenceOpen,
    preferenceToggle
}) => {
    // ------------------------STYLES------------------------//
    const styles = {
        overlayStyle:{
            display: isPreferenceOpen ? 'block' : 'none',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            height: '90vh',
            width: '90vw',
            maxWidth: '105em',
            maxHeight: '65em',
            position: 'absolute',
            padding: '30px',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '3px solid transparent',
            backdropFilter: 'blur(30px)',
            borderColor: '#30434B',
            borderRadius:'15px'
        },
        headerBox:{
            height: '3rem',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
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
            <Box sx={styles.headerBox}>
                <Typography variant={'h1'}>Preferences</Typography>
            </Box>
            <CloseOutlined onClick={preferenceToggle} sx={{ ...styles.closeButton, cursor:'pointer' }}/>
            <Box sx={styles.tabContainer}>
                <VerticalTabs tabs={['currentGame','keyboardShortcuts','cardSleeves','gameOptions']}></VerticalTabs>
            </Box>
        </Box>
    );
};

export default Preferences;