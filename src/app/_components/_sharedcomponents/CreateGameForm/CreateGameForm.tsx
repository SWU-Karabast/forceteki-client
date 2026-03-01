import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import {
    Box,
    Button,
    Checkbox,
    FormControl,
    FormControlLabel,
    MenuItem,
    Typography,
    Radio,
    RadioGroup,
    Link,
    Divider,
    Tooltip,
} from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { SwuGameFormat, SupportedDeckSources, GamesToWinMode, QueueFormatOptions, QueueFormatLabels, DefaultQueueFormatKey } from '@/app/_constants/constants';
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
    gamesToWinMode: GamesToWinMode;
    saveDeck: boolean;
}

interface IDeckPreferencesHandlers {
    setShowSavedDecks: (value: boolean) => void;
    setFavoriteDeck: (value: string) => void;
    setFormat: (value: SwuGameFormat) => void;
    setGamesToWinMode: (value: GamesToWinMode) => void;
    setSaveDeck: (value: boolean) => void;
}

interface ICreateGameFormProps {
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
    isBo3Allowed: boolean;
}

const CreateGameForm: React.FC<ICreateGameFormProps> = ({
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
    setModalOpen,
    isBo3Allowed
}) => {
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();
    
    const { showSavedDecks, favoriteDeck, format, gamesToWinMode, saveDeck } = deckPreferences;
    const { setShowSavedDecks, setFavoriteDeck, setFormat, setGamesToWinMode, setSaveDeck } = deckPreferencesHandlers;

    // Common State
    const [privateGame, setPrivateGame] = useState<boolean>(false);
    const [thirtyCardMode, setThirtyCardMode] = useState<boolean>(false);
    
    // Get the current format option key from format and gamesToWinMode
    const getCurrentFormatOptionKey = (): string => {
        for (const [key, value] of Object.entries(QueueFormatOptions)) {
            if (value.format === format && value.gamesToWinMode === gamesToWinMode) {
                return key;
            }
        }
        return DefaultQueueFormatKey;
    };

    const formatOptionKeys = Object.keys(QueueFormatOptions);

    // Helper to check if a format option is Bo3
    const isBo3Option = (key: string) => 
        QueueFormatOptions[key]?.gamesToWinMode === GamesToWinMode.BestOfThree;

    // Additional State for Non-Creategame Path
    const [lobbyName, setLobbyName] = useState<string>('');
    
    const handleChangeFormatOption = (optionKey: string) => {
        const option = QueueFormatOptions[optionKey];
        if (option) {
            setFormat(option.format);
            setGamesToWinMode(option.gamesToWinMode);
        }
    };

    useEffect(() => {
        handleJsonDeck(deckLink);
    }, [deckLink]);

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

    const handleChangeDeckSelectionType = (useSavedDecks: boolean) => {
        setShowSavedDecks(useSavedDecks);
        clearErrors();
    }

    // Handle Create Game Submission
    const handleCreateGameSubmitActual = async () => {
        let userDeck;
        let deckType = 'url';
        // check whether the favourite deck was selected or a decklink was used. The decklink always has precedence
        if(showSavedDecks) {
            const selectedDeck = savedDecks.find(deck => deck.deckID === favoriteDeck);
            userDeck = '';
            if (selectedDeck?.deckLink) {
                userDeck = selectedDeck?.deckLink
            }
        }else{
            userDeck = deckLink;
        }

        let deckData = null;
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
                setError('Couldn\'t import. Deck is invalid or unsupported deckbuilder',
                    'Incorrect deck format or unsupported deckbuilder.',
                    'Deck Validation Error','error');
                setModalOpen(true);
            }
        }catch (error){
            clearErrors();
            if(error instanceof Error){
                if(error.message?.includes('403')) {
                    setError('Couldn\'t import. The deck is set to private.',
                        { [DeckValidationFailureReason.DeckSetToPrivate]: true },
                        'Deck Validation Error',
                        'error')
                    setModalOpen(true);
                } else if(error.message?.includes('Deck not found')) {
                    // Handle the specific 404 error messages from any deck source
                    setError(error.message,error.message,'Deck not found','error');
                    setModalOpen(true);
                } else {
                    setError('Couldn\'t import. Deck is invalid.',undefined,'Deck Validation Error','error');
                    setModalOpen(true);
                }
            }
            return;
        }
        try {
            // save deck to storage first!
            if (saveDeck && deckData && deckLink && deckType === 'url'){
                if(user) {
                    await saveDeckToServer(deckData, deckLink, user);
                    deckData.isPresentInDb = true;
                }else{
                    saveDeckToLocalStorage(deckData, deckLink);
                }
            }
            const payload = {
                user: getUserPayload(user),
                deck: deckData,
                isPrivate: privateGame,
                format: format,
                lobbyName: lobbyName,
                allow30CardsInMainBoard: thirtyCardMode,
                gamesToWinMode: gamesToWinMode,
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/create-lobby`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    credentials: 'include'
                }
            );
            const result = await response.json();
            if (!response.ok) {
                const errors = result.errors || {};
                if(response.status === 403){
                    setError('You must wait at least 20s before creating a new game.',
                        'You left the previous game/lobby abruptly, you can reconnect or wait 20s before starting a new game/lobby. Please use the game/lobby exit buts in the UI and avoid using the back button or closing the browser to leave games.',
                        'Creation not allowed',
                        'error');
                    setModalOpen(true);
                } else if(response.status === 400) {
                    // TODO: better error handling between BE and FE
                    if (result.message?.includes('Invalid game format') || result.message?.includes('You must be logged in')) {
                        setError(null,result.message,'Create Game Error','error');
                    } else {
                        setError('Couldn\'t import. Deck is invalid.',errors,'Deck Validation Error','error');
                    }
                    setModalOpen(true);
                } else {
                    setError('Couldn\'t import. Deck is invalid.',errors,'Deck Validation Error','error');
                    setModalOpen(true);
                }
                return;
            }
            clearErrors();
            router.push('/lobby');
        } catch {
            setError('Error creating game.',undefined,'Server error','error');
            setModalOpen(true);
        }
    };

    const handleCreateGameSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        handleFormSubmissionWithUndoCheck(handleCreateGameSubmitActual);
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
        },
        errorMessageStyle: {
            color: 'var(--initiative-red);',
            mt: '0.5rem'
        },
        errorMessageLink:{
            cursor: 'pointer',
            color: 'var(--selection-red);',
            textDecorationColor: 'var(--initiative-red);',
        },
        errorMessageLinkPlain:{
            ml: '2px',
            cursor: 'pointer',
            color: 'white',
            textDecorationColor: 'white',
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
                Create New Lobby
            </Typography>
            {/* <Typography variant="h3" sx={styles.labelTextStyle}>
                Deck Selection
            </Typography>
            <Divider sx={{ mb: '5px' }}/> */}
            <form onSubmit={handleCreateGameSubmit}>
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
                    <>
                        {/* Favourite Decks Input */}
                        <FormControl fullWidth sx={styles.formControlStyle}>
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
                    </>
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
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>{
                                    clearErrors();
                                    setDeckLink(e.target.value);
                                    handleJsonDeck(e.target.value);
                                }}
                            />
                        </FormControl>
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

                <Typography variant="h3" sx={styles.labelTextStyle}>
                    Lobby Settings
                </Typography>
                <Divider sx={{ mb: '5px' }}/>
                {/* Additional Fields for Non-Creategame Path */}

                {/* Format Selection */}
                <FormControl fullWidth sx={styles.formControlStyle}>
                    <Typography variant="body1" sx={styles.labelTextStyle}>Format</Typography>
                    <StyledTextField
                        select
                        value={getCurrentFormatOptionKey()}
                        required
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleChangeFormatOption(e.target.value)
                        }
                    >
                        {formatOptionKeys
                            .slice()
                            .sort((a, b) => {
                                const aDisabled = isBo3Option(a) && !isBo3Allowed;
                                const bDisabled = isBo3Option(b) && !isBo3Allowed;
                                return Number(aDisabled) - Number(bDisabled);
                            })
                            .map((key) => {
                                const isBo3 = isBo3Option(key);
                                const disabled = isBo3 && !isBo3Allowed;
                                return (
                                    <MenuItem key={key} value={key} disabled={disabled}>
                                        {QueueFormatLabels[key] || key}
                                        {disabled && ' (must be logged in)'}
                                    </MenuItem>
                                );
                            })}
                    </StyledTextField>
                </FormControl>
                {/* Privacy Selection */}
                <FormControl component="fieldset" sx={styles.formControlStyle}>
                    <RadioGroup
                        row
                        value={privateGame ? 'Private' : 'Public'}
                        onChange={(
                            e: ChangeEvent<HTMLInputElement>,
                            value: string
                        ) => setPrivateGame(value === 'Private')}
                    >
                        <FormControlLabel
                            value="Public"
                            control={<Radio sx={styles.checkboxStyle} />}
                            label={
                                <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                    Public
                                </Typography>
                            }
                        />
                        <FormControlLabel
                            value="Private"
                            control={<Radio sx={styles.checkboxStyle} />}
                            label={
                                <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                    Private
                                </Typography>
                            }
                        />
                    </RadioGroup>
                </FormControl>

                {/* Beta Announcement */}
                <Typography variant="body1" sx={{ color: 'orange', textAlign: 'center', mb: '1rem' }}>
                    Next Set Preview format is now available!
                </Typography>

                {!privateGame && (
                    <>
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            <Typography variant="body1" sx={styles.labelTextStyle}>
                                Game Name
                            </Typography>
                            <StyledTextField
                                type="text"
                                value={lobbyName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setLobbyName(e.target.value)
                                }
                                placeholder="Game #"
                            />
                        </FormControl>
                    </>
                )}

                {privateGame && format === SwuGameFormat.Open && (
                    <>
                        <Typography variant="body1" sx={styles.labelTextStyle}>
                            Mainboard Minimum Size
                        </Typography>
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            <StyledTextField
                                select
                                value={thirtyCardMode ? '30Card' : '50Card'}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setThirtyCardMode(e.target.value === '30Card')
                                }
                            >
                                <MenuItem value="50Card">50 Cards</MenuItem>
                                <MenuItem value="30Card">30 Cards</MenuItem>
                            </StyledTextField>
                        </FormControl>
                    </>
                )}

                {/* Submit Button */}
                <Button type="submit" variant="contained" sx={styles.submitButtonStyle}>
                    Create Game
                </Button>
            </form>
            <ErrorModal
                open={errorState.modalOpen}
                onClose={() => setModalOpen(false)}
                title={errorState.title}
                errors={errorState.details}
                format={format}
                modalType={errorState.modalType}
            />
        </Box>
    );
};

export default React.memo(CreateGameForm);
