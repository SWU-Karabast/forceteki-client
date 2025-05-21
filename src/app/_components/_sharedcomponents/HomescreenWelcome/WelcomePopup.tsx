// Updated WelcomePopup.tsx
// Adds a brief "What's New" section informing users about
// 1. The new Decks page with cloud-saved decks
// 2. Newly added personal statistics panel for logged-in users
// 3. Displays a highlighted screenshot illustrating the new Stats panel

'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import Image from 'next/image';
import { useUser } from '@/app/_contexts/User.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { setUsernameOnServer, setWelcomeMessage } from '@/app/_utils/DeckStorageUtils';

interface WelcomePopupProps {
    open: boolean;
    onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ open, onClose }) => {
    const { user, updateUsername } = useUser();
    const [username, setUsername] = useState<string>(user?.username || '');
    const [userErrorSummary, setUserErrorSummary] = useState<string | null>(null);
    const [successfulUsernameChange, setSuccessfulUsernameChange] = useState(false);
    const [canSubmitUsername, setCanSubmitUsername] = useState(false);

    const handleSkip = async () => {
        await setWelcomeMessage(user);
        onClose();
    };

    const handleSetUsername = async () => {
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            setUserErrorSummary('Username cannot be empty');
            return;
        }
        if (trimmedUsername.length < 3) {
            setUserErrorSummary('Username must be at least 3 characters long');
            return;
        }
        try {
            const newUsername = await setUsernameOnServer(user, trimmedUsername);
            setSuccessfulUsernameChange(true);
            setTimeout(() => setSuccessfulUsernameChange(false), 2000);
            updateUsername(newUsername);
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                setUserErrorSummary(error.message);
            } else {
                setUserErrorSummary('Error changing username');
            }
        }
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
                    'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box'
            }
        },
        title: {
            color: '#018DC1',
            fontSize: '2rem',
            textAlign: 'left',
            marginBottom: '16px'
        },
        subtitle: {
            fontSize: '1.2rem',
            color: '#fff',
            marginTop: '1.5rem',
            marginBottom: '0.5rem'
        },
        message: {
            fontSize: '1rem',
            color: '#fff',
            marginBottom: '16px'
        },
        textFieldContainer: {
            display: 'flex',
            mt: '1em',
            mb: '1.5em',
            justifyContent: 'center'
        },
        textField: {
            backgroundColor: '#3B4252',
            borderRadius: '5px',
            width: '100%',
            '& .MuiInputBase-input': {
                color: '#fff'
            },
            '& .MuiInputBase-input::placeholder': {
                color: '#fff'
            }
        },
        infoList: {
            marginTop: '8px',
            paddingLeft: '16px',
            '& li::marker': { color: '#B8860B' }
        },
        infoItem: {
            color: '#B8860B',
            fontSize: '0.85rem',
            marginBottom: '4px'
        },
        whatsNewList: {
            pl: '16px',
            mt: '4px',
            '& li::marker': { color: '#B4DCEB' }
        },
        whatsNewItem: {
            color: '#B4DCEB',
            fontSize: '0.9rem',
            marginBottom: '6px'
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
            gap: '16px'
        },
        skipButton: {
            backgroundColor: '#2F4055',
            color: '#fff',
            '&:hover': { backgroundColor: '#3A5169' },
            minWidth: '120px'
        },
        setUsernameButton: {
            backgroundColor: '#2F7DB6',
            color: '#fff',
            '&:hover': { backgroundColor: '#3590D2' },
            minWidth: '120px'
        },
        successMessage: { color: 'var(--selection-green)', mt: '0.5rem' },
        errorMessage: { color: 'var(--initiative-red)', mt: '0.5rem' },
        screenshotWrapper: {
            mt: '12px',
            display: 'flex',
            justifyContent: 'center'
        }
    } as const;

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') return; // disable backdrop closing
            }}
            disableEscapeKeyDown
            aria-labelledby="welcome-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id="welcome-dialog-title">
                    Welcome to Karabast!
                </Typography>
                <Typography variant="body1" sx={styles.message}>
                    Before you start playing, we recommend setting a username that other players will see during games.
                </Typography>
                <Typography variant="body1" sx={styles.message}>
                    Would you like to set your username now?
                </Typography>

                <Box sx={styles.textFieldContainer}>
                    <TextField
                        placeholder={user?.username}
                        value={username}
                        onChange={(e) => {
                            const newUsername = e.target.value;
                            setUsername(newUsername);
                            setCanSubmitUsername(newUsername.trim().length >= 3);
                        }}
                        sx={styles.textField}
                    />
                </Box>

                {/* Validation / success messages */}
                {userErrorSummary && (
                    <Typography variant="body1" sx={styles.errorMessage}>
                        {userErrorSummary}
                    </Typography>
                )}
                {successfulUsernameChange && (
                    <Typography variant="body1" sx={styles.successMessage}>
                        Username successfully changed!
                    </Typography>
                )}

                <Box component="ul" sx={styles.infoList}>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            You can change your username <strong>freely for 1 hour</strong>. After that, changes are allowed every
                            <strong> 4 months</strong>.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            Usernames must be respectful, non-offensive, and free of impersonation, hate speech, slurs, or inappropriate
                            content.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            You can also change your username later in the <strong>Preference</strong> tab.
                        </Typography>
                    </li>
                </Box>

                <Typography variant="h5" sx={styles.subtitle}>
                    ✨ What’s New in this update
                </Typography>
                <Box component="ul" sx={styles.whatsNewList}>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Decks Anywhere</strong> – Build, save, and favorite decks in the new <em>Decks</em> tab. <em>When</em> logged in all of your creations
                            are saved to the server, so they automatically appear on any device where you log in.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                            <strong>Player Stats</strong> – Track your wins, losses, and match-up win‑rates! A new statistics panel lives in the
                            bottom-left of the deck screen and updates automatically after every game.
                        </Typography>
                    </li>
                </Box>
                <Box sx={styles.screenshotWrapper}>
                    <Image
                        src="/statsExample.png"
                        alt="Highlighted Stats Panel"
                        width={500}
                        height={260}
                        style={{ borderRadius: '8px' }}
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton buttonFnc={handleSkip} text="Skip" variant="standard" />
                <PreferenceButton
                    buttonFnc={handleSetUsername}
                    text="Set Username"
                    variant="standard"
                    sx={canSubmitUsername ? { backgroundColor: '#3590D2', '&:hover': { backgroundColor: '#4BA3E8' } } : {}}
                    disabled={!canSubmitUsername}
                />
            </DialogActions>
        </Dialog>
    );
};

export default WelcomePopup;
