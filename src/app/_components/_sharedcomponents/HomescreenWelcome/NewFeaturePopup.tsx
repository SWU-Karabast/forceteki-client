'use client';
import React from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
} from '@mui/material';
import Image from 'next/image';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { announcement } from '@/app/_constants/mockData';
import parse from 'html-react-parser';

interface IWhatsNewPopupProps {
    open: boolean;
    onClose: () => void;
}

const WhatsNewPopupAnnouncement: React.FC<IWhatsNewPopupProps> = ({ open, onClose }) => {
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
        subtitle: {
            fontSize: '1.2rem',
            color: '#fff',
            marginTop: '0.5rem',
            marginBottom: '0.5rem',
        },
        whatsNewList: {
            pl: '16px',
            mt: '4px',
            '& li::marker': { color: '#B4DCEB' },
        },
        whatsNewItem: {
            color: '#B4DCEB',
            fontSize: '0.9rem',
            marginBottom: '6px',
        },
        screenshotWrapper: {
            mt: '12px',
            display: 'flex',
            justifyContent: 'center',
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
            gap: '16px',
        },
        closeButton: {
            backgroundColor: '#2F7DB6',
            color: '#fff',
            '&:hover': { backgroundColor: '#3590D2' },
            minWidth: '120px',
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
            aria-labelledby="whats-new-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id="whats-new-dialog-title">
                    ✨ {parse(announcement.title ?? '')}
                </Typography>

                <Box component="ul" sx={styles.whatsNewList}>
                    <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                        {parse(announcement.content ?? '')}
                    </Typography>
                </Box>
                {announcement.image && (
                    <Box sx={styles.screenshotWrapper}>
                        <Image
                            src={announcement.image}
                            alt="Highlighted Stats Panel"
                            width={400}
                            height={240}
                            style={{ borderRadius: '8px', width: '33em', height: '14em' }}
                        />

                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={onClose} text="Got it" variant="standard" />
            </DialogActions>
        </Dialog>
    );
};

export default WhatsNewPopupAnnouncement;