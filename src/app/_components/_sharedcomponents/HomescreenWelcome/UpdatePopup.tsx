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
                    ✨ Deck Management
                </Typography>

                <Box component="ul" sx={styles.whatsNewList}>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Decks Anywhere</strong> – Build, save, and favorite decks in the new <em>Decks</em> tab. When logged in all of your
                            creations are saved to the server, so they automatically appear on any device where you log in.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Player Stats</strong> – Track your wins, losses, and match‑up win‑rates! A new statistics panel lives in the bottom-left of the
                            deck screen and updates automatically after every game.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>SWUSTATS</strong> – Track your wins, losses, card statistics on SWUStats! By linking your Karabast account to your SWUStats account in the Preferences page.
                        </Typography>
                    </li>
                </Box>

                <Box sx={styles.screenshotWrapper}>
                    <Image
                        src="/statsExample.png"
                        alt="Highlighted Stats Panel"
                        width={200}
                        height={240}
                        style={{ borderRadius: '8px', width: '12em', height: '14em', marginRight:'100px' }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={handleClose} text="Got it!" variant="standard" />
            </DialogActions>
        </Dialog>
    );
};

export default WhatsNewPopup;