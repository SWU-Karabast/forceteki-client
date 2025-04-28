'use client';
import React, { useState } from 'react';
import { Box, Typography, Dialog, DialogContent, DialogActions, Button, TextField, Link } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { setUsernameOnServer } from '@/app/_utils/DeckStorageUtils';

interface WelcomePopupProps {
    open: boolean;
    onClose: () => void;
}

const WelcomePopup: React.FC<WelcomePopupProps> = ({ open, onClose }) => {
    const { user, updateUsername } = useUser();
    const [username, setUsername] = useState<string>(user?.username || '');
    const [userErrorSummary, setUserErrorSummary] = useState<string | null>(null);
    const [successfulUsernameChange, setSuccesfulUsernameChange] = useState(false);
    const [canSubmitUsername, setCanSubmitUsername] = useState(false);

    const handleSkip = () => {
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

        try{
            const newUsername = await setUsernameOnServer(trimmedUsername);
            setSuccesfulUsernameChange(true);
            setTimeout(() => {
                setSuccesfulUsernameChange(false);
            }, 2000);
            updateUsername(newUsername);
        }catch (error){
            console.log(error);
            if(error instanceof Error) {
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
                maxWidth: '600px',
                width: '100%',
                padding: '20px',
                border: '2px solid transparent',
                background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            },
        },
        title: {
            color: '#018DC1',
            fontSize: '2rem',
            textAlign: 'left',
            marginBottom: '16px',
        },
        message: {
            fontSize: '1rem',
            color: '#fff',
            marginBottom: '16px',
        },
        textFieldContainer: {
            display: 'flex',
            mt: '1em',
            mb: '1.5em',
            justifyContent: 'center',
        },
        textField: {
            backgroundColor: '#3B4252',
            borderRadius: '5px',
            width: '100%',
            '& .MuiInputBase-input': {
                color: '#fff',
            },
            '& .MuiInputBase-input::placeholder': {
                color: '#fff',
            },
        },
        infoList: {
            marginTop: '8px',
            paddingLeft: '16px',
        },
        infoItem: {
            color: '#B8860B',
            fontSize: '0.85rem',
            marginBottom: '4px',
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
            gap: '16px',
        },
        skipButton: {
            backgroundColor: '#2F4055',
            color: '#fff',
            '&:hover': {
                backgroundColor: '#3A5169',
            },
            minWidth: '120px',
        },
        setUsernameButton: {
            backgroundColor: '#2F7DB6',
            color: '#fff',
            '&:hover': {
                backgroundColor: '#3590D2',
            },
            minWidth: '120px',
        },
        successMessageStyle: {
            color: 'var(--selection-green);',
            mt: '0.5rem'
        },
        errorMessageLink:{
            cursor: 'pointer',
            color: 'var(--selection-red);',
            textDecorationColor: 'var(--initiative-red);',
        },
        errorMessageStyle: {
            color: 'var(--initiative-red);',
            mt: '0.5rem'
        },
        preferenceAddedStyle: {
            backgroundColor: '#3590D2',
            '&:hover':{
                backgroundColor: '#4BA3E8',
            }
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
                        placeholder="Your Username"
                        value={username}
                        onChange={(e) => {
                            const newUsername = e.target.value;
                            setUsername(newUsername);
                            setCanSubmitUsername(newUsername.length >= 3);
                        }}
                        sx={styles.textField}
                    />
                </Box>
                {userErrorSummary ? (
                    <Typography variant={'body1'} sx={styles.errorMessageStyle}>
                        {userErrorSummary}{' '}
                    </Typography>
                ): successfulUsernameChange ? (
                    <Typography variant={'body1'} sx={styles.successMessageStyle}>
                        Username successfully changed!
                    </Typography>
                ) : null}
                <Box sx={styles.infoList}>
                    <Typography variant="body2" sx={styles.infoItem}>
                        • You can change your username freely for 1 hour. After that, changes are allowed every 4 months.
                    </Typography>
                    <Typography variant="body2" sx={styles.infoItem}>
                        • Usernames must be respectful, non-offensive, and free of impersonation, hate speech, slurs, or inappropriate content.
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