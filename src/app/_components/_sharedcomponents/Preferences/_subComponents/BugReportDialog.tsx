import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Alert,
    styled, Link
} from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';

interface BugReportDialogProps {
    open: boolean;
    onClose: () => void;
}

const StyledDialog = styled(Dialog)(() => ({
    '& .MuiDialog-paper': {
        backgroundColor: '#1A2331', // Dark blue-black background
        color: 'white',
        borderRadius: '12px',
        border: '1px solid rgba(79, 171, 210, 0.3)', // Subtle blue border
        boxShadow: '0 0 15px rgba(79, 171, 210, 0.2)', // Blue glow effect
        overflow: 'hidden',
        maxWidth: '500px',
        width: '100%'
    },
    '& .MuiBackdrop-root': {
        backgroundColor: 'rgba(0, 0, 0, 0.7)' // Darker backdrop
    }
}));

const StyledDialogTitle = styled(DialogTitle)(() => ({
    fontSize: '1.5rem',
    fontWeight: 500,
    borderBottom: '1px solid rgba(79, 171, 210, 0.2)',
    padding: '20px 24px',
    color: 'white'
}));

const StyledDialogContent = styled(DialogContent)(() => ({
    padding: '24px',
    color: 'rgba(255, 255, 255, 0.9)'
}));

const StyledDialogActions = styled(DialogActions)(() => ({
    padding: '16px 24px',
    borderTop: '1px solid rgba(79, 171, 210, 0.2)',
    justifyContent: 'center'
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        color: 'white',
        '& fieldset': {
            borderColor: 'rgba(79, 171, 210, 0.5)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(79, 171, 210, 0.8)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#4FABD2',
        },
    },
    '& .MuiInputLabel-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-focused': {
            color: '#4FABD2',
        },
    },
    '& .MuiFormHelperText-root': {
        color: 'rgba(255, 255, 255, 0.7)',
        '&.Mui-error': {
            color: theme.palette.error.main,
        },
    },
}));

const StyledInfoAlert = styled(Alert)(() => ({
    backgroundColor: 'rgba(255, 214, 0, 0.2)',  // Light yellow background
    color: '#ffd54f',                          // Yellow text
    border: '1px solid rgba(255, 214, 0, 0.3)', // Yellow border
    '& .MuiAlert-icon': {
        color: '#ffd54f'                       // Yellow icon
    }
}));

const StyledSuccessAlert = styled(Alert)(() => ({
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    color: '#81c784',
    border: '1px solid rgba(46, 125, 50, 0.3)',
    '& .MuiAlert-icon': {
        color: '#81c784'
    }
}));

const BugReportDialog: React.FC<BugReportDialogProps> = ({ open, onClose }) => {
    const { sendLobbyMessage, lobbyState, connectedPlayer, bugReportState, isSpectator } = useGame();
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(bugReportState?.success);
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;

    const MAX_DESCRIPTION_LENGTH = 1000;

    // Clear form error if server error changes
    useEffect(() => {
        setSuccess(bugReportState?.success);
        if (!success) {
            setError(bugReportState?.message);
        }
    }, [bugReportState?.id]);

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDescription(value);

        // Clear any previous error message
        if (error) setError('');
    };

    const handleSubmit = async () => {
        // Validate the description
        if (!description.trim()) {
            setError('Please provide a description of the bug');
            return;
        }

        if (description.length > MAX_DESCRIPTION_LENGTH) {
            setError(`Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`);
            return;
        }
        setError('');

        try {
            // Send the bug report to the server
            sendLobbyMessage(['reportBug', description]);
        } catch (err) {
            setError('An error occurred while submitting the bug report');
            console.error('Error submitting bug report:', err);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset the form
        setTimeout(() => {
            setDescription('');
            setError('');
            setSuccess('');
        }, 300);
    };
    return (
        <StyledDialog open={open} onClose={handleClose}>
            <StyledDialogTitle>Report a Bug</StyledDialogTitle>
            <StyledDialogContent>
                {isSpectator ? (
                    <StyledInfoAlert severity="info" sx={{ my: 1 }}>
                        Bug reporting is disabled for spectators, feel free to report at our <Link
                            href="https://discord.com/channels/1220057752961814568/1345468050568380568"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                            discord channel
                        </Link>
                    </StyledInfoAlert>
                ): success ? (
                    <StyledSuccessAlert severity="success" sx={{ my: 1 }}>
                        Bug report submitted successfully. Thank you for helping improve the game!
                    </StyledSuccessAlert>
                ) : connectedUser?.reportedBugs >= 3 ? (
                    <StyledInfoAlert severity="info" sx={{ my: 1 }}>
                        You&#39;ve sent the maximum number of bug reports for this game session.
                        Please report any additional bugs to our <Link
                            href="https://discord.com/channels/1220057752961814568/1345468050568380568"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                            discord channel
                        </Link>
                    </StyledInfoAlert>
                ) : (
                    <>
                        <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255, 255, 255, 0.7)' }}>
                            Please describe the bug you encountered. This will automatically include the current game state.
                        </Typography>
                        <StyledTextField
                            label="Bug Description"
                            multiline
                            rows={5}
                            fullWidth
                            variant="outlined"
                            value={description}
                            onChange={handleDescriptionChange}
                            error={!!error || description.length > MAX_DESCRIPTION_LENGTH}
                            helperText={
                                error ? (
                                    <span>
                                        {error} Please contact us via our{' '}
                                        <Link
                                            href="https://discord.com/channels/1220057752961814568/1345468050568380568"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{ color: 'inherit', textDecoration: 'underline' }}
                                        >
                                            Discord channel
                                        </Link>{' '}
                                        if this issue persists.
                                    </span>
                                ) : (
                                    <span style={{
                                        color: description.length > MAX_DESCRIPTION_LENGTH ? 'error.main' : 'inherit'
                                    }}>
                                        {description.length}/{MAX_DESCRIPTION_LENGTH} characters
                                        {description.length > MAX_DESCRIPTION_LENGTH && ' (exceeded limit)'}
                                    </span>
                                )
                            }
                            sx={{ mb: 2 }}
                        />
                    </>
                )}
            </StyledDialogContent>
            <StyledDialogActions>
                {(success || connectedUser?.reportedBugs >= 3) ? (
                    <PreferenceButton
                        buttonFnc={handleClose}
                        variant="standard"
                        text={'Ok'}
                    />
                ):(
                    <>
                        <PreferenceButton
                            buttonFnc={handleClose}
                            variant="concede"
                            text={'Cancel'}
                        />
                        <PreferenceButton
                            buttonFnc={handleSubmit}
                            variant="standard"
                            disabled={!description.trim() || description.length > MAX_DESCRIPTION_LENGTH || success}
                            text={'Submit Report'}
                        />
                    </>
                )}
            </StyledDialogActions>
        </StyledDialog>
    );
};

export default BugReportDialog;