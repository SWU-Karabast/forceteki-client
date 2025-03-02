import React from 'react';
import { Box, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface ConfirmationDialogProps {
    open: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open,
    title,
    message,
    onCancel,
    onConfirm,
    confirmButtonText = 'Delete',
    cancelButtonText = 'Cancel'
}) => {
    if (!open) return null;

    // ----------------------Styles-----------------------------//
    const styles = {
        overlayStyle: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        dialogStyle: {
            padding: '2rem',
            borderRadius: '15px',
            border: '2px solid transparent',
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            width: '400px',
            maxWidth: '90%',
        },
        titleStyle: {
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '1rem',
        },
        messageStyle: {
            color: '#C7C7C7',
            marginBottom: '2rem',
            textAlign: 'center',
        },
        buttonContainerStyle: {
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
        },
    }
    return (
        <Box sx={styles.overlayStyle}>
            <Box sx={styles.dialogStyle}>
                <Typography sx={styles.titleStyle}>{title}</Typography>
                <Typography sx={styles.messageStyle}>{message}</Typography>
                <Box sx={styles.buttonContainerStyle}>
                    <PreferenceButton text={cancelButtonText} buttonFnc={onCancel} variant={'standard'}/>
                    <PreferenceButton text={confirmButtonText} buttonFnc={onConfirm} variant={'concede'}/>
                </Box>
            </Box>
        </Box>
    );
};

export default ConfirmationDialog;