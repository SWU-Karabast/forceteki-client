import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
} from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface UnsavedChangesDialogProps {
    open: boolean;
    onDiscard: () => void;
    onCancel: () => void;
}

const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
    open,
    onDiscard,
    onCancel,
}) => {
    const styles = {
        dialog: {
            '& .MuiDialog-paper': {
                backgroundColor: '#1E2D32',
                borderRadius: '20px',
                maxWidth: '520px',
                width: '100%',
                padding: '20px',
                border: '2px solid transparent',
                background:
                    'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            },
        },
        title: {
            color: '#018DC1',
            fontSize: '1.8rem',
            textAlign: 'center',
            marginBottom: '16px',
        },
        message: {
            color: '#B4DCEB',
            fontSize: '1rem',
            textAlign: 'center',
            marginBottom: '24px',
            lineHeight: 1.5,
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
            gap: '16px',
        },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (reason === 'backdropClick') return; // disable backdrop closing
                onCancel();
            }}
            disableEscapeKeyDown
            aria-labelledby="unsaved-changes-dialog-title"
            sx={styles.dialog}
        >
            <DialogContent>
                <Typography variant="h4" sx={styles.title} id="unsaved-changes-dialog-title">
                    ⚠️ Unsaved Changes
                </Typography>

                <Typography sx={styles.message}>
                    You have unsaved sound preference changes.
                    <br />
                    What would you like to do?
                </Typography>
            </DialogContent>

            <DialogActions sx={styles.actions}>
                <PreferenceButton
                    buttonFnc={onCancel}
                    text="Cancel"
                    variant="standard"
                />
                <PreferenceButton
                    buttonFnc={onDiscard}
                    text="Discard Changes"
                    variant="concede"
                />
            </DialogActions>
        </Dialog>
    );
};

export default UnsavedChangesDialog;