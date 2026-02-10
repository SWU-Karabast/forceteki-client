'use client';
import React from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
} from '@mui/material';
import Image from 'next/image';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { setWelcomeUpdateMessage } from '@/app/_utils/ServerAndLocalStorageUtils';
import { useUser } from '@/app/_contexts/User.context';

interface WhatsNewPopupProps {
    open: boolean;
    onClose: () => void;
}

const WhatsNewPopup: React.FC<WhatsNewPopupProps> = ({ open, onClose }) => {
    const { user } = useUser();

    const handleClose = async () => {
        await setWelcomeUpdateMessage(user);
        onClose();
    };

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
                    ✨ SWU Stats Deck Integration
                </Typography>

                <Box component="ul" sx={styles.whatsNewList}>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Manage your decks in one place!</strong> – Link your SWU Stats account in Preferences, and your SWU Stats decks will automatically appear when creating games!
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Favorite Decks First</strong> – Your favorite decks from SWU Stats are marked with ★ and appear at the top of the list for quick access.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Seamless Switching</strong> – When SWU Stats is linked, your decks are pulled directly from SWU Stats. When not linked, you'll see your Karabast saved decks instead.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Easy Management</strong> – Manage your SWU Stats decks directly on{' '}
                            <a href="https://swustats.net" target="_blank" rel="noopener noreferrer" style={{ color: '#3590D2' }}>
                                swustats.net
                            </a>
                        </Typography>
                    </li>
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={handleClose} text="Got it!" variant="standard" />
            </DialogActions>
        </Dialog>
    );
};

export default WhatsNewPopup;