import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    Link,
    MenuItem,
    Radio,
    RadioGroup,
    Tooltip,
    Typography
} from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { FormatLabels, SupportedDeckSources, SwuGameFormat } from '@/app/_constants/constants';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';
import { StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import {
    getUserPayload,
    saveDeckToLocalStorage,
    saveDeckToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { DeckErrorState } from '@/app/_hooks/useDeckErrors';

interface IDeckPreferences {
    showSavedDecks: boolean;
    favoriteDeck: string;
    format: SwuGameFormat;
    saveDeck: boolean;
}

interface IDeckPreferencesHandlers {
    setShowSavedDecks: (value: boolean) => void;
    setFavoriteDeck: (value: string) => void;
    setFormat: (value: SwuGameFormat) => void;
    setSaveDeck: (value: boolean) => void;
}

interface IQuickGameFormProps {
    deckPreferences: IDeckPreferences;
    deckPreferencesHandlers: IDeckPreferencesHandlers;
    deckLink: string;
    setDeckLink: (value: string) => void;
    savedDecks: StoredDeck[];
    handleDeckManagement: () => void;
    handleFormSubmissionWithUndoCheck: (originalSubmissionFn: () => void) => void;
    errorState: DeckErrorState;
    setError: (summary: string | null, details?: IDeckValidationFailures | string, title?: string, modalType?: 'error' | 'warning') => void;
    clearErrors: () => void;
    setIsJsonDeck: (value: boolean) => void;
    setModalOpen: (value: boolean) => void;
}

const QuickGameForm: React.FC<IQuickGameFormProps> = ({
    deckPreferences,
    deckPreferencesHandlers,
    deckLink,
    setDeckLink,
    savedDecks,
    handleDeckManagement,
    handleFormSubmissionWithUndoCheck,
    errorState,
    setError,
    clearErrors,
    setIsJsonDeck,
    setModalOpen
}) => {
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();
    
    const { showSavedDecks, favoriteDeck, format, saveDeck } = deckPreferences;
    const { setShowSavedDecks, setFavoriteDeck, setFormat, setSaveDeck } = deckPreferencesHandlers;
    // Common State
    const [queueState, setQueueState] = useState<boolean>(false)

    const formatOptions = Object.values(SwuGameFormat);
    // Timer ref for clearing the inline text after 5s

    useEffect(() => {
        handleJsonDeck(deckLink);
    }, [deckLink]);

    const handleChangeFormat = (format: SwuGameFormat) => {
        setFormat(format);
    }

    const handleChangeDeckSelectionType = (useSavedDecks: boolean) => {
        setShowSavedDecks(useSavedDecks);
        clearErrors();
    }

    const handleJsonDeck = (deckLink: string) => {
        const parsedInput = parseInputAsDeckData(deckLink);
        if(parsedInput.type === 'json'){
            setIsJsonDeck(true)
            setSaveDeck(false);
            setError(null,'We do not support saving JSON decks at this time. Please import the deck into a deckbuilder such as SWUDB and use link import.','JSON Decks Notice','warning')
            return;
        }
        clearErrors()
        setIsJsonDeck(false);
    }

    // Handle Create Game Submission
    const handleJoinGameQueueActual = async () => {
        setQueueState(true);
        // Get the deck link - either from selected favorite or direct input
        let userDeck = '';
        let deckType = 'url';
        if(showSavedDecks) {
            const selectedDeck = savedDecks.find(deck => deck.deckID === favoriteDeck);
            if (selectedDeck?.deckLink) {
                userDeck = selectedDeck.deckLink;
            }
        } else {
            userDeck = deckLink;
        }
        let deckData = null
        try {
            const parsedInput = parseInputAsDeckData(userDeck);
            deckType = parsedInput.type;
            if(parsedInput.type === 'url') {
                deckData = userDeck ? await fetchDeckData(userDeck, false) : null;
                if(favoriteDeck && deckData && showSavedDecks) {
                    deckData.deckID = favoriteDeck;
                    deckData.deckLink = userDeck;
                    deckData.isPresentInDb = !!user;
                }else if(!showSavedDecks && userDeck && deckData) {
                    deckData.deckLink = userDeck
                    deckData.isPresentInDb = false;
                }
            }else if(parsedInput.type === 'json') {
                deckData = parsedInput.data
            }else{
                setQueueState(false);
                setError('Couldn\'t import. Deck is invalid or unsupported deckbuilder','Incorrect deck format or unsupported deckbuilder.','Deck Validation Error','error');
                setModalOpen(true)
                return;
            }
        }catch (error){
            setQueueState(false);
            clearErrors();
            if(error instanceof Error){
                if(error.message?.includes('403')) {
                    setError('Couldn\'t import. The deck is set to private.',{ [DeckValidationFailureReason.DeckSetToPrivate]: true },'Deck Validation Error','error');
                    setModalOpen(true)
                } else if(error.message?.includes('Deck not found')) {
                    // Handle the specific 404 error messages from any deck source
                    setError(error.message,error.message,'Deck Not Found','error')
                    setModalOpen(true);
                } else {
                    setError('Couldn\'t import. Deck is invalid.',undefined,'Deck Validation Error','error');
                    setModalOpen(true)
                }
            }
            return;
        }
        try {
            // Save the deck if needed first!
            if (saveDeck && deckData && userDeck && deckType === 'url') {
                if(user) {
                    await saveDeckToServer(deckData, userDeck, user);
                    deckData.isPresentInDb = true;
                }else{
                    saveDeckToLocalStorage(deckData, userDeck);
                }
            }

            const payload = {
                user: getUserPayload(user),
                deck: deckData,
                format: format,
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/enter-queue`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    credentials:'include'
                }
            );
            const result = await response.json();
            if (!response.ok) {
                const errors = result.errors || {};
                if (response.status === 403) {
                    setQueueState(false)
                    setError('You must wait at least 20s before creating a new game.',
                        'You left the previous game/lobby abruptly or are still in one. You can reconnect or wait 20s before starting a new game/lobby. Please use the game/lobby exit buttons in the UI and avoid using the back button or closing the browser to leave games.',
                        'Matchmaking not allowed',
                        'error');
                    setModalOpen(true)
                }else if(response.status === 400) {
                    if (result.message?.includes('Invalid game format')) {
                        setError(null,result.message,'Join Queue Error','error');
                    } else {
                        setError('Couldn\'t import. Deck is invalid.',errors,'Deck Validation Error','error');
                    }
                    setQueueState(false);
                    setModalOpen(true)
                } else {
                    setQueueState(false);
                    setError('Server error, please try again. If the issue persists, please let us know in the Karabast discord.',
                        errors,'Matchmaking Error','error');
                    setModalOpen(true)
                }
                return
            }
            clearErrors()
            router.push('/quickGame');
        } catch {
            setQueueState(false);
            setError('Error creating game.',undefined,'Server error','error');
            setModalOpen(true)
        }
    };

    const handleJoinGameQueue = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleFormSubmissionWithUndoCheck(handleJoinGameQueueActual);
    };

    const styles = {
        formControlStyle: {
            mb: '1rem',
        },
        labelTextStyle: {
            mb: '.5em',
            color: 'white',
        },
        labelTextStyleSecondary: {
            color: '#aaaaaa',
            display: 'inline',
        },
        checkboxStyle: {
            color: '#fff',
            '&.Mui-checked': {
                color: '#fff',
            },
            '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)',
            },
        },
        checkboxAndRadioGroupTextStyle: {
            color: '#fff',
            fontSize: '1em',
        },
        submitButtonStyle: {
            display: 'block',
            ml: 'auto',
            mr: 'auto',
            mt: '5px',
        },
        errorMessageStyle: {
            color: 'var(--initiative-red);',
            mt: '0.5rem'
        },
        errorMessageLinkPlain:{
            ml: '2px',
            cursor: 'pointer',
            color: 'white',
            textDecorationColor: 'white',
        },
        errorMessageLink:{
            cursor: 'pointer',
            color: 'var(--selection-red);',
            textDecorationColor: 'var(--initiative-red);',
        },
        manageDecks:{
            mt: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        manageDecksContainer:{
            display: 'flex',
            justifyContent: 'start',
            width: '100%',
        }
    }
    return (
        <Box >
            <Typography variant="h2">
                Join Matchmaking Queue
            </Typography>
            <form onSubmit={handleJoinGameQueue}>
                <FormControl component="fieldset" sx={styles.formControlStyle}>
                    <RadioGroup
                        row
                        value={showSavedDecks ? 'Saved Deck' : 'New Deck'}
                        onChange={(
                            e: ChangeEvent<HTMLInputElement>,
                            value: string
                        ) => handleChangeDeckSelectionType(value === 'Saved Deck')}
                    >
                        <FormControlLabel
                            value="Saved Deck"
                            control={<Radio sx={styles.checkboxStyle} />}
                            label={
                                <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                    Saved Deck
                                </Typography>
                            }
                        />
                        <FormControlLabel
                            value="New Deck"
                            control={<Radio sx={styles.checkboxStyle} />}
                            label={
                                <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                    New Deck
                                </Typography>
                            }
                        />
                    </RadioGroup>
                </FormControl>
                {showSavedDecks && (
                    <FormControl fullWidth sx={styles.formControlStyle}>
                        {/* Favourite Decks Input */}
                        <Typography variant="body1" sx={styles.labelTextStyle}>Favorite Decks</Typography>
                        <StyledTextField
                            select
                            value={favoriteDeck}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                setFavoriteDeck(e.target.value as string)
                            }
                            disabled={userLoading}
                            placeholder="Favorite Decks"
                        >
                            {savedDecks.length === 0 ? (
                                <MenuItem value="" disabled>
                                    No saved decks found
                                </MenuItem>
                            ) : (
                                savedDecks.map((deck) => (
                                    <MenuItem key={deck.deckID} value={deck.deckID}>
                                        {deck.favourite ? '★ ' : ''}{deck.name}
                                    </MenuItem>
                                ))
                            )}
                        </StyledTextField>
                        <Box sx={styles.manageDecksContainer}>
                            <Button
                                onClick={handleDeckManagement}
                                sx={styles.manageDecks}
                            >
                                Manage&nbsp;Decks
                            </Button>
                        </Box>
                    </FormControl>
                ) || (
                    <>
                        {/* Deck Link Input */}
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            <Box sx={styles.labelTextStyle}>
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
                                OR paste deck JSON directly
                            </Box>
                            <StyledTextField
                                type="text"
                                value={deckLink}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    clearErrors()
                                    setDeckLink(e.target.value);
                                    handleJsonDeck(e.target.value);
                                }}
                            />
                        </FormControl>

                        {/* Save Deck To Favourites Checkbox */}
                        <FormControlLabel
                            sx={{ mb: '1rem' }}
                            control={
                                <Checkbox
                                    sx={styles.checkboxStyle}
                                    disabled={errorState.isJsonDeck}
                                    checked={saveDeck}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                        checked: boolean
                                    ) => setSaveDeck(checked)}
                                />
                            }
                            label={
                                <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                    {errorState.isJsonDeck ? (
                                        <Box>
                                            JSON format cannot be saved.
                                            <Link
                                                sx={styles.errorMessageLinkPlain}
                                                onClick={() => setModalOpen(true)}
                                            >Details
                                            </Link>
                                        </Box>
                                    ) : 'Save Deck List'}
                                </Typography>
                            }
                        />
                    </>
                )}

                {errorState.summary && (
                    <Typography variant={'body1'} sx={styles.errorMessageStyle}>
                        {errorState.summary}{' '}
                        <Link
                            sx={styles.errorMessageLink}
                            onClick={() => setModalOpen(true)}
                        >Details
                        </Link>
                    </Typography>
                )}

                <FormControl fullWidth sx={styles.formControlStyle}>
                    <Typography variant="body1" sx={styles.labelTextStyle}>Format</Typography>
                    <StyledTextField
                        select
                        value={format}
                        required
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleChangeFormat(e.target.value as SwuGameFormat)
                        }
                    >
                        {formatOptions.map((fmt) => (
                            <MenuItem key={fmt} value={fmt}>
                                {FormatLabels[fmt] || fmt}
                            </MenuItem>
                        ))}
                    </StyledTextField>
                </FormControl>

                {/* Submit Button */}
                <Button type="submit" disabled={queueState} variant="contained" sx={{ ...styles.submitButtonStyle,
                    '&.Mui-disabled': {
                        backgroundColor: '#404040',
                        color: 'var(--variant-containedColor)',
                    },
                    mb: '1rem',
                }}>
                    {queueState ? 'Queueing...' : 'Join Queue'}
                </Button>
            </form>
            <ErrorModal
                open={errorState.modalOpen}
                onClose={() => setModalOpen(false) }
                title={errorState.title}
                errors={errorState.details}
                format={format}
                modalType={errorState.modalType}
            />
        </Box>
    );
};

export default React.memo(QuickGameForm);
