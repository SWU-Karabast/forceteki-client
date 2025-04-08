import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Alert,
    styled
} from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';

interface BugReportDialogProps {
    open: boolean;
    onClose: () => void;
}

// Custom styled components to match the design in the image
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

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
    fontSize: '1.5rem',
    fontWeight: 500,
    borderBottom: '1px solid rgba(79, 171, 210, 0.2)',
    padding: '20px 24px',
    color: 'white'
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
    padding: '24px',
    color: 'rgba(255, 255, 255, 0.9)'
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
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

const StyledSuccessAlert = styled(Alert)(({ theme }) => ({
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    color: '#81c784',
    border: '1px solid rgba(46, 125, 50, 0.3)',
    '& .MuiAlert-icon': {
        color: '#81c784'
    }
}));

const BugReportDialog: React.FC<BugReportDialogProps> = ({ open, onClose }) => {
    const { sendLobbyMessage, lobbyState, connectedPlayer } = useGame();
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;

    const MAX_DESCRIPTION_LENGTH = 500;

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
            setSuccess(true);
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
            setSuccess(false);
        }, 300);
    };
    return (
        <StyledDialog open={open} onClose={handleClose}>
            <StyledDialogTitle>Report a Bug</StyledDialogTitle>
            <StyledDialogContent>
                {(success || connectedUser?.reportedBugs >= 3) ? (
                    <StyledSuccessAlert severity="success" sx={{ my: 1 }}>
                        Bug report submitted successfully. Thank you for helping improve the game!
                    </StyledSuccessAlert>
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
                            error={!!error}
                            helperText={error || `${description.length}/${MAX_DESCRIPTION_LENGTH} characters`}
                            sx={{ mb: 2 }}
                        />
                    </>
                )}
            </StyledDialogContent>
            <StyledDialogActions>
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
            </StyledDialogActions>
        </StyledDialog>
    );
};

export default BugReportDialog;