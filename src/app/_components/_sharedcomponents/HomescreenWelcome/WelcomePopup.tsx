'use client';
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Dialog, DialogContent, DialogActions, TextField, Link
} from '@mui/material';

import { useUser } from '@/app/_contexts/User.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { setUsernameOnServer } from '@/app/_utils/DeckStorageUtils';
import { validateDiscordUsername } from '@/app/_validators/UsernameValidation/UserValidation';

interface WelcomePopupProps {
    open: boolean;
    onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ open, onClose }) => {
    const { user, updateUsername } = useUser();
    // Initialize username from user context or empty string
    const [username, setUsername] = useState<string>('');
    const [userErrorSummary, setUserErrorSummary] = useState<string | null>(null);
    const [canSubmitUsername, setCanSubmitUsername] = useState(false);

    useEffect(() => {
        if (open) {
            const initialUsername = user?.username || '';
            const validationError = validateDiscordUsername(initialUsername);
            setUserErrorSummary(validationError);
            setCanSubmitUsername(validationError === null && initialUsername.trim() !== '');
        } else {
            // Reset states when dialog is closed
            setUserErrorSummary(null);
            setCanSubmitUsername(false);
        }
    }, [open, user?.username]); // Rerun when dialog opens or the initial username changes

    const handleSkip = async () => {
        onClose();
    };

    const handleSetUsername = async () => {
        const validationError = validateDiscordUsername(username);

        if (validationError) {
            setUserErrorSummary(validationError);
            setCanSubmitUsername(false);
            return;
        }
        setUserErrorSummary(null);

        try {
            const newUsernameFromServer = await setUsernameOnServer(user, username.trim());
            updateUsername(newUsernameFromServer);
            onClose();
        } catch (error) {
            console.log(error);
            if (error instanceof Error) {
                setUserErrorSummary(error.message);
            } else {
                setUserErrorSummary('An unexpected error occurred while changing username.');
            }
            setCanSubmitUsername(false);
        }
    };

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUsername = e.target.value;
        setUsername(newUsername);

        const validationError = validateDiscordUsername(newUsername);
        setUserErrorSummary(validationError);
        setCanSubmitUsername(validationError === null && newUsername.trim() !== '');
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
            marginTop: '0.5rem',
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
            mb: '0.5em',
            justifyContent: 'center'
        },
        textField: {
            backgroundColor: '#3B4252',
            borderRadius: '5px',
            width: '100%',
            '& .MuiInputBase-input': { color: '#fff' },
            '& .MuiInputBase-input::placeholder': { color: '#B0B0B0', opacity: 0.7 },
        },
        validationMessagesContainer: {
            marginTop: '4px',
            minHeight: '24px',
            marginBottom: '2px',
        },
        infoList: {
            marginTop:'2px',
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
            justifyContent: 'center',
        },
        successMessageStyle: {
            color: 'var(--selection-green)',
            fontSize: '0.9rem'
        },
        errorMessageStyle: {
            color: 'var(--initiative-red)',
            fontSize: '0.9rem'
        },
        preferenceAddedStyle: {
            backgroundColor: '#3590D2',
            '&:hover':{ backgroundColor: '#4BA3E8' }
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
                        placeholder={user?.username || 'Enter your username'}
                        value={username}
                        onChange={handleUsernameChange}
                        sx={styles.textField}
                        error={!!userErrorSummary}
                        fullWidth
                    />
                </Box>

                <Box sx={styles.validationMessagesContainer}>
                    {userErrorSummary && (
                        <Typography variant={'body2'} sx={styles.errorMessageStyle}>
                            {userErrorSummary}
                        </Typography>
                    )}
                </Box>
                <Box component="ul" sx={styles.infoList}>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            You can change your username <strong>freely for 1 week</strong>. After that, changes are allowed <strong>once per 
                                month</strong>.
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            Usernames must be <strong>respectful and non-offensive</strong>
                        </Typography>
                    </li>
                    <li>
                        <Typography component="span" variant="body2" sx={styles.infoItem}>
                            You can also change your username later in the <strong>Preferences</strong> tab
                        </Typography>
                    </li>
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