'use client';
import React from 'react';
import { Box, Modal, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

export interface IErrorScreenAction {
    label: string;
    onClick: () => void;

    /** 'concede' renders the red treatment, 'standard' the neutral one. Defaults to standard. */
    variant?: 'concede' | 'standard';
}

interface IErrorDialogProps {
    open: boolean;
    title: string;
    message: string;

    /** Extra technical detail (raw server text). Shown smaller, under the message. */
    detail?: string;
    actions: IErrorScreenAction[];
}

/**
 * Error dialog used in place of browser `alert()` dialogs. Styled to match ErrorModal so
 * the two read as the same thing, but takes its own set of recovery actions rather than a
 * single Close button. There is deliberately no backdrop or escape dismissal - the actions
 * are the only way out, since some errors have no state left to return to.
 */
export const ErrorDialog: React.FC<IErrorDialogProps> = ({
    open,
    title,
    message,
    detail,
    actions,
}) => {
    const styles = {
        dialog: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.87)',
            border: '2px solid var(--initiative-red)',
            borderRadius: '5px',
            padding: '1.5rem',
            outline: 'none',
            width: '28rem',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
        },
        title: {
            color: 'var(--initiative-red)',
            fontSize: '1.25rem',
            fontWeight: 600,
            mb: '0.75rem',
        },
        message: {
            color: '#CFD6DF',
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        detail: {
            color: '#8A94A2',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            mt: '0.75rem',
            wordBreak: 'break-word',
        },
        actions: {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '1rem',
            mt: '1.5rem',
        },
    };

    return (
        <Modal open={open} aria-labelledby="error-dialog-title">
            <Box sx={styles.dialog} role="alertdialog" aria-labelledby="error-dialog-title">
                <Typography sx={styles.title} id="error-dialog-title">{title}</Typography>
                <Typography sx={styles.message}>{message}</Typography>
                {detail && <Typography sx={styles.detail}>{detail}</Typography>}
                <Box sx={styles.actions}>
                    {actions.map((action) => (
                        <PreferenceButton
                            key={action.label}
                            variant={action.variant ?? 'standard'}
                            text={action.label}
                            buttonFnc={action.onClick}
                        />
                    ))}
                </Box>
            </Box>
        </Modal>
    );
};

export default ErrorDialog;
