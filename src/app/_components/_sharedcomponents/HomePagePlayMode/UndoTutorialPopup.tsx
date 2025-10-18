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

interface IUndoTutorialPopupProps {
    open: boolean;
    onClose: () => void;
}

const UndoTutorialPopup: React.FC<IUndoTutorialPopupProps> = ({ open, onClose }) => {
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
        infoItem: {
            color: '#B8860B',
            fontSize: '0.85rem',
            marginBottom: '4px'
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
                    ✨ Undo in Public Games
                </Typography>

                <Box component="ul" sx={styles.whatsNewList}>
                    <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                        Undo in public games (queue and public lobbies) has special rules to prevent abuse.
                    </Typography>
                    <br/>
                    <br/>

                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            You receive <strong>one &quot;free&quot; undo per game</strong>. After it is used, every undo will <strong>send a request to the opponent 
                                for approval</strong>. They can allow or deny the request.
                        </Typography>
                    </li>
                    <br/>

                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            Undo in certain game situations, <strong>such as after drawing or revealing cards</strong>, will <strong>always </strong>
                            require opponent approval (even if you have a free undo available).
                        </Typography>
                    </li>
                    <br/>

                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            If enough undo requests are rejected, a player will have the option to <strong>block any further undo requests in that game</strong>.
                        </Typography>
                    </li>
                </Box>
                <Box sx={styles.screenshotWrapper}>
                    <Image
                        src="/undo-button.png"
                        alt="Highlighted Stats Panel"
                        width={232}
                        height={64}
                        style={{ borderRadius: '8px', marginRight:'100px' }}
                    />
                </Box>
                <Box sx={styles.screenshotWrapper}>
                    <Image
                        src="/request-undo.png"
                        alt="Highlighted Stats Panel"
                        width={232}
                        height={66}
                        style={{ borderRadius: '8px', marginRight:'100px' }}
                    />
                </Box>
                <Box sx={styles.screenshotWrapper}>
                    <Image
                        src="/blocked-undo.png"
                        alt="Highlighted Stats Panel"
                        width={232}
                        height={65}
                        style={{ borderRadius: '8px', marginRight:'100px' }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={onClose} text="Got it" variant="standard" />
            </DialogActions>
        </Dialog>
    );
};

export default UndoTutorialPopup;