'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
} from '@mui/material';

import { useUser } from '@/app/_contexts/User.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { setUsernameOnServer } from '@/app/_utils/DeckStorageUtils';
import { validateDiscordUsername } from '@/app/_validators/UsernameValidation/UserValidation';

interface UsernameChangeRequiredPopupProps {
    open: boolean;
}

/**
 * A mandatory username-change dialog shown when
 * userProfile.needsUsernameChange === true
 */
const UsernameChangeRequiredPopup: React.FC<UsernameChangeRequiredPopupProps> = ({
    open,
}) => {
    const { user, updateUsername, updateNeedsUsernameChange } = useUser();

    const [username, setUsername] = useState<string>('');
    const [userErrorSummary, setUserErrorSummary] = useState<string | null>(null);
    const [canSubmitUsername, setCanSubmitUsername] = useState<boolean>(false);

    /* re-initialise whenever dialog opens */
    useEffect(() => {
        if (open) {
            setUsername('');
            setUserErrorSummary(null);
            setCanSubmitUsername(false);
        }
    }, [open]);

    const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUsername = e.target.value;
        setUsername(newUsername);

        const validationError = validateDiscordUsername(newUsername);
        const isDifferent = newUsername.trim() !== '' && newUsername !== user?.username;

        setUserErrorSummary(validationError);
        setCanSubmitUsername(validationError === null && isDifferent);
    };

    const handleSetUsername = async () => {
        const validationError = validateDiscordUsername(username);

        if (validationError) {
            setUserErrorSummary(validationError);
            setCanSubmitUsername(false);
            return;
        }

        try {
            const newUsername = await setUsernameOnServer(user, username.trim());
            updateUsername(newUsername);
            updateNeedsUsernameChange();
        } catch (error) {
            console.error(error);
            setUserErrorSummary(
                error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred while changing username.',
            );
            setCanSubmitUsername(false);
        }
    };

    /* ─────────────── Styles ─────────────── */

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
            color: '#DC3545',
            fontSize: '2rem',
            textAlign: 'left',
            marginBottom: '16px',
        },
        message: { fontSize: '1rem', color: '#fff', marginBottom: '16px' },
        textFieldContainer: {
            display: 'flex',
            mt: '1em',
            mb: '0.5em',
            justifyContent: 'center',
        },
        textField: {
            backgroundColor: '#3B4252',
            borderRadius: '5px',
            width: '100%',
            '& .MuiInputBase-input': { color: '#fff' },
            '& .MuiInputBase-input::placeholder': { color: '#B0B0B0', opacity: 0.7 },
        },
        errorMessageStyle: {
            color: 'var(--initiative-red)',
            fontSize: '0.9rem',
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
        },
        setUsernameButton: {
            backgroundColor: '#2F7DB6',
            color: '#fff',
            '&:hover': { backgroundColor: '#3590D2' },
            minWidth: '140px',
        },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={() => {}}
            disableEscapeKeyDown
            aria-labelledby="username-required-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id="username-required-dialog-title">
                    Username change required
                </Typography>

                <Typography variant="body1" sx={styles.message}>
                    We’ve received a report that your username violates our guidelines. You must
                    choose a new username before you can continue using the client.
                </Typography>

                <Box sx={styles.textFieldContainer}>
                    <TextField
                        placeholder="Enter a new username"
                        value={username}
                        onChange={handleUsernameChange}
                        sx={styles.textField}
                        error={!!userErrorSummary}
                        fullWidth
                    />
                </Box>

                {userErrorSummary && (
                    <Typography variant="body2" sx={styles.errorMessageStyle}>
                        {userErrorSummary}
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={styles.actions}>
                <PreferenceButton
                    buttonFnc={handleSetUsername}
                    text="Change Username"
                    variant="standard"
                    sx={
                        canSubmitUsername
                            ? styles.setUsernameButton
                            : { ...styles.setUsernameButton, opacity: 0.4 }
                    }
                    disabled={!canSubmitUsername}
                />
            </DialogActions>
        </Dialog>
    );
};

export default UsernameChangeRequiredPopup;
