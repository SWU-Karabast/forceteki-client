import React, { useState, ChangeEvent } from 'react';
import { Box, Link, Typography, IconButton, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DeckSource, fetchDeckData, IDeckData } from '@/app/_utils/fetchDeckData';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { v4 as uuid } from 'uuid';
import { useUser } from '@/app/_contexts/User.context';
import { saveDeckToLocalStorage, saveDeckToServer } from '@/app/_utils/ServerAndLocalStorageUtils';
import { SupportedDeckSources } from '@/app/_constants/constants';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';

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
    const { user } = useUser();

    const handleSubmit = async () => {
        if (!deckLink) return;
        try {
            const deckType = parseInputAsDeckData(deckLink)
            if(deckType.type === 'json'){
                setErrorTitle('Deck Validation Error');
                setDeckErrorSummary('We do not support direct deck JSON imports.');
                setDeckErrorDetails('We do not support direct deck JSON imports.')
                setErrorModalOpen(true);
                return;
            }
            const deckData = await fetchDeckData(deckLink, false);
            if (deckData) {
                deckData.deckID = user ? await saveDeckToServer(deckData, deckLink, user) : saveDeckToLocalStorage(deckData,deckLink);
                if(!deckData.deckID){
                    throw new Error('There was an error when saving the deck to the server.');
                }
                onSuccess(deckData, deckLink);
                // Reset form
                setDeckLink('');
                onClose();
            }
        } catch (error) {
            setDeckErrorDetails(undefined);
            if (error instanceof Error) {
                if (error.message.includes('403')) {
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
            }else{
                setErrorTitle('Server error');
                setDeckErrorSummary('Server error when saving deck to server.');
                setDeckErrorDetails('There was an error when saving deck to the server. Please contact the developer team on discord.');
                setErrorModalOpen(true);
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
                        Deck link (
                        <Tooltip
                            arrow={true}
                            title={
                                <Box sx={{ whiteSpace: 'pre-line' }}>
                                    {SupportedDeckSources.join('\n')}
                                </Box>
                            }
                        >
                            <Link sx={{ color: 'lightblue', textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                                supported deckbuilders
                            </Link>
                        </Tooltip>
                        )
                        <br />
                        We do <strong>not</strong> support direct JSON input
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