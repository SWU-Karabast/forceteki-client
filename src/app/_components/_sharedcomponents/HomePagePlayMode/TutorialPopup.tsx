'use client';
import React from 'react';
import {
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
} from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface ITutorialPopupProps {
    open: boolean;
    onClose: () => void;
    title: React.ReactNode;
    titleId: string;
    children: React.ReactNode;
}

const TutorialPopup: React.FC<ITutorialPopupProps> = ({ open, onClose, title, titleId, children }) => {
    const styles = {
        dialog: {
            '& .MuiDialog-paper': {
                backgroundColor: '#1E2D32',
                borderRadius: '20px',
                maxWidth: '720px',
                width: '100%',
                padding: '20px',
                border: '2px solid transparent',
                background:
                    'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            },
        },
        title: {
            color: '#018DC1',
            fontSize: '2rem',
            textAlign: 'left',
            marginBottom: '16px',
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
            gap: '16px',
        },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') return; // disable backdrop closing
                onClose();
            }}
            disableEscapeKeyDown
            aria-labelledby={titleId}
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id={titleId}>
                    {title}
                </Typography>
                {children}
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={onClose} text="Got it" variant="standard" />
            </DialogActions>
        </Dialog>
    );
};

export default TutorialPopup;
