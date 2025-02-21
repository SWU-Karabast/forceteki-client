'use client';
import React from 'react';
import { Box, Modal, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { getReadableDeckErrors } from '@/app/_validators/DeckValidation/getReadableDeckErrors';
import { IDeckValidationFailures } from '@/app/_validators/DeckValidation/DeckValidationTypes';

interface ErrorModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    errors?: IDeckValidationFailures;
    format?: string;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
    open,
    onClose,
    title,
    errors,
    format = 'Premier',
}) => {
    // Inline styling for the modal content
    const messages = errors ? getReadableDeckErrors(errors, format) : ['Unknown error'];
    const modalStyle = {
        position: 'absolute' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.87)', // A dark background
        border: '2px solid var(--initiative-red)', // initiative-red border
        borderRadius: '5px',
        padding: '1.5rem',
        color: 'black',
        outline: 'none',
        minWidth: '400px',
        maxWidth: '90vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: '200px',
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <Typography variant="h6" sx={{ color: 'var(--initiative-red)' }}>
                    {title}
                </Typography>

                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                    {messages.map((msg, index) => (
                        <li key={index}>
                            <Typography variant="body1" sx={{ color: 'white' }}>
                                {msg}
                            </Typography>
                        </li>
                    ))}
                </ul>

                <PreferenceButton
                    variant="concede"
                    buttonFnc={onClose}
                    text={'Close'}
                />
                
            </Box>
        </Modal>
    );
};