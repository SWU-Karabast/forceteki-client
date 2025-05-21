'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Dialog, DialogContent, DialogActions, TextField, Link } from '@mui/material'; // Removed Button as PreferenceButton is used
import { useUser } from '@/app/_contexts/User.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { setUsernameOnServer, setWelcomeMessage } from '@/app/_utils/DeckStorageUtils';
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
    const [successfulUsernameChange, setSuccesfulUsernameChange] = useState(false);
    const [canSubmitUsername, setCanSubmitUsername] = useState(false);

    useEffect(() => {
        if (open) {
            const initialUsername = user?.username || '';
            setUsername(initialUsername); // Pre-fill the username input
            const validationError = validateDiscordUsername(initialUsername);
            setUserErrorSummary(validationError);
            setCanSubmitUsername(validationError === null && initialUsername.trim() !== '');
        } else {
            // Reset states when dialog is closed
            setUserErrorSummary(null);
            setSuccesfulUsernameChange(false);
            setCanSubmitUsername(false);
        }
    }, [open, user?.username]); // Rerun when dialog opens or the initial username changes

    const handleSkip = async () => {
        await setWelcomeMessage(user);
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
            setSuccesfulUsernameChange(true);
            updateUsername(newUsernameFromServer);
            setTimeout(() => {
                onClose();
            }, 1500); // Give user time to see success message
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
        setSuccesfulUsernameChange(false);

        const validationError = validateDiscordUsername(newUsername);
        setUserErrorSummary(validationError);
        setCanSubmitUsername(validationError === null && newUsername.trim() !== '');
    };

    const styles = {
        dialog: {
            '& .MuiDialog-paper': {
                backgroundColor: '#1E2D32',
                borderRadius: '20px',
                maxWidth: '600px',
                width: '100%',
                padding: '20px',
                border: '2px solid transparent',
                background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            },
        },
        title: { color: '#018DC1', fontSize: '2rem', textAlign: 'left', marginBottom: '16px' },
        message: { fontSize: '1rem', color: '#fff', marginBottom: '16px' },
        textFieldContainer: { display: 'flex', mt: '1em', mb: '1em', justifyContent: 'center' },
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
            marginBottom: '12px',
        },
        infoList: {
            marginTop: '8px',
            paddingLeft: '16px'
        },
        infoItem: {
            color: '#B8860B',
            fontSize: '0.85rem',
            marginBottom: '4px'
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0 0',
            gap: '16px'
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
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="welcome-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title}>
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
                    {userErrorSummary ? (
                        <Typography variant={'body2'} sx={styles.errorMessageStyle}>
                            {userErrorSummary}
                        </Typography>
                    ) : successfulUsernameChange ? (
                        <Typography variant={'body2'} sx={styles.successMessageStyle}>
                            Username successfully changed!
                        </Typography>
                    ) : null}
                </Box>

                <Box sx={styles.infoList}>
                    <Typography variant="body2" sx={styles.infoItem} style={{ marginTop: '12px' }}>
                        • You can change your username <strong>freely for 1 hour</strong>. After that, changes are allowed every <strong>4 months</strong>.
                    </Typography>
                    <Typography variant="body2" sx={styles.infoItem}>
                        • Usernames must be respectful, non-offensive, and free of impersonation, hate speech, slurs, or inappropriate content.
                    </Typography>
                    <Typography variant="body2" sx={styles.infoItem}>
                        • You can also change your username in the <strong>Preference tab</strong>.
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                <PreferenceButton
                    buttonFnc={handleSkip}
                    text={'Skip'}
                    variant={'standard'}
                />
                <PreferenceButton
                    buttonFnc={handleSetUsername}
                    text={'Set Username'}
                    variant={'standard'}
                    sx={canSubmitUsername ? styles.preferenceAddedStyle : {}}
                    disabled={!canSubmitUsername}
                />
            </DialogActions>
        </Dialog>
    );
};

export default WelcomePopup;