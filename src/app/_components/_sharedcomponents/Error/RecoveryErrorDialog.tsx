'use client';

import React from 'react';
import { Box, Dialog, DialogActions, DialogContent, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

export type RecoveryErrorActionVariant = 'standard' | 'concede' | 'warning';

export interface IRecoveryErrorAction {
    label: string;
    onClick: () => void;
    variant?: RecoveryErrorActionVariant;
}

interface IRecoveryErrorDialogProps {
    open: boolean;
    title: string;
    message: React.ReactNode;
    actions: IRecoveryErrorAction[];
    onClose: () => void;
}

const RecoveryErrorDialog: React.FC<IRecoveryErrorDialogProps> = ({
    open,
    title,
    message,
    actions,
    onClose,
}) => {
    const styles = {
        dialog: {
            '& .MuiDialog-paper': {
                backgroundColor: '#1E2D32',
                borderRadius: '12px',
                maxWidth: '520px',
                width: 'calc(100% - 32px)',
                padding: '20px',
                border: '2px solid transparent',
                background:
                    'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            },
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 8px 4px',
        },
        iconFrame: {
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '1px solid #C40000',
            color: '#FF6B6B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            lineHeight: 1,
            backgroundColor: 'rgba(124, 7, 7, 0.24)',
        },
        title: {
            color: '#FFFFFF',
            fontSize: '1.35rem',
            fontWeight: 700,
            textAlign: 'center',
        },
        message: {
            color: '#B4DCEB',
            fontSize: '1rem',
            lineHeight: 1.5,
            textAlign: 'center',
            whiteSpace: 'pre-line',
        },
        actions: {
            justifyContent: 'center',
            flexWrap: 'wrap',
            padding: '20px 0 0',
            gap: '12px',
        },
        button: {
            minWidth: '112px',
        },
    } as const;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="recovery-error-dialog-title"
            aria-describedby="recovery-error-dialog-message"
            sx={styles.dialog}
        >
            <DialogContent sx={styles.content}>
                <Box sx={styles.iconFrame}>!</Box>
                <Typography sx={styles.title} id="recovery-error-dialog-title">
                    {title}
                </Typography>
                <Typography sx={styles.message} id="recovery-error-dialog-message" component="div">
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={styles.actions}>
                {actions.map((action) => (
                    <PreferenceButton
                        key={action.label}
                        text={action.label}
                        variant={action.variant ?? 'standard'}
                        buttonFnc={action.onClick}
                        sx={styles.button}
                    />
                ))}
            </DialogActions>
        </Dialog>
    );
};

export default RecoveryErrorDialog;
