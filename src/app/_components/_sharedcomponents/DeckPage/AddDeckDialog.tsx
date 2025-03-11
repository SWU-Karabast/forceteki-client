import React, { useState, ChangeEvent } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchDeckData, IDeckData } from '@/app/_utils/fetchDeckData';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { saveDeckToLocalStorage } from '@/app/_utils/LocalStorageUtils';

interface AddDeckDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: (deckData: IDeckData, deckLink: string) => void;
}
const AddDeckDialog: React.FC<AddDeckDialogProps> = ({
    open,
    onClose,
    onSuccess
}) => {
    const [deckLink, setDeckLink] = useState<string>('');
    const [errorModalOpen, setErrorModalOpen] = useState<boolean>(false);
    const [errorTitle, setErrorTitle] = useState<string>('Deck Validation Error');
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | string | undefined>(undefined);

    const handleSubmit = async () => {
        if (!deckLink) return;

        try {
            const deckData = await fetchDeckData(deckLink, false);
            if (deckData) {
                saveDeckToLocalStorage(deckData, deckLink);
                onSuccess(deckData, deckLink);
                onClose();
                // Reset form
                setDeckLink('');
            }
        } catch (error) {
            setDeckErrorDetails(undefined);
            if (error instanceof Error) {
                if (error.message.includes('Forbidden')) {
                    setDeckErrorSummary('Couldn\'t import. The deck is set to private');
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorDetails({
                        [DeckValidationFailureReason.DeckSetToPrivate]: true,
                    });
                    setErrorModalOpen(true);
                } else {
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                    setErrorModalOpen(true);
                }
            }
        }
    };

    if (!open) return null;

    // ----------------------Styles-----------------------------//
    const styles = {
        overlayStyle: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        dialogStyle: {
            padding: '2rem',
            borderRadius: '15px',
            border: '2px solid transparent',
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            width: '500px',
            maxWidth: '90%',
            position: 'relative',
        },
        titleStyle: {
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '1.5rem',
        },
        closeButtonStyle: {
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: 'white',
        },
        inputContainerStyle: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
        },
        textFieldContainerStyle: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
        },
        errorTextStyle: {
            color: 'var(--initiative-red)',
            fontSize: '0.875rem',
            marginTop: '0.25rem',
        },
    }
    return (
        <>
            <Box sx={styles.overlayStyle}>
                <Box sx={styles.dialogStyle}>
                    <IconButton
                        sx={styles.closeButtonStyle}
                        onClick={onClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>

                    <Typography sx={styles.titleStyle}>Add New Deck</Typography>

                    <Typography sx={{ color: 'white', marginBottom: '0.75rem' }}>
                        SWUDB Deck link (use the url or &#39;Deck Link&#39; button)
                    </Typography>

                    <Box sx={styles.inputContainerStyle}>
                        <Box sx={styles.textFieldContainerStyle}>
                            <StyledTextField
                                value={deckLink}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setDeckLink(e.target.value);
                                    setDeckErrorSummary(null);
                                }}
                                placeholder="https://swudb.com/deck/xxxxxx"
                                fullWidth
                            />

                            {deckErrorSummary && (
                                <Typography sx={styles.errorTextStyle}>
                                    {deckErrorSummary}
                                </Typography>
                            )}
                        </Box>
                        <PreferenceButton text={'Add Deck'} variant={'standard'} buttonFnc={handleSubmit}/>
                    </Box>
                </Box>
            </Box>

            <ErrorModal
                open={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                title={errorTitle}
                errors={deckErrorDetails}
            />
        </>
    );
};

export default AddDeckDialog;