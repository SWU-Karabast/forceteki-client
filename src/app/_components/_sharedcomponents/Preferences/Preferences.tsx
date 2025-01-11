import React from 'react';
import { PopupData, PopupType, usePopup } from '@/app/_contexts/Popup.context';
import { useGame } from '@/app/_contexts/Game.context';
import { DefaultPopupModal } from '@/app/_components/_sharedcomponents/Popup/PopupVariant/DefaultPopup';
import { DefaultPopup, PilePopup, SelectCardsPopup } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { PilePopupModal } from '@/app/_components/_sharedcomponents/Popup/PopupVariant/PilePopup';
import { SelectCardsPopupModal } from '@/app/_components/_sharedcomponents/Popup/PopupVariant/SelectCardsPopup';
import { Box, Button, Typography } from '@mui/material';
import { CloseOutlined, SettingsOutlined } from '@mui/icons-material';
import VerticalTabs from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VerticalTabs';

const Preferences: React.FC = () => {
    const renderPreferencesContent = (type: PopupType, data: PopupData) => {
        switch (type) {
            case 'default':
                return <DefaultPopupModal data={data as DefaultPopup} />;
            case 'pile':
                return <PilePopupModal data={data as PilePopup} />;
            case 'select':
                return <SelectCardsPopupModal data={data as SelectCardsPopup} />;
            default:
                return null;
        }
    };

    // ------------------------STYLES------------------------//
    const styles = {
        overlayStyle:{
            height: '90vh',
            width: '90vw',
            position: 'absolute',
            padding: '30px',
            left:'5vw',
            top:'5vh',
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
            <CloseOutlined sx={{ ...styles.closeButton, cursor:'pointer' }}/>
            <Box sx={styles.tabContainer}>
                <VerticalTabs></VerticalTabs>
            </Box>
        </Box>
    );
};

export default Preferences;