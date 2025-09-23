import React, { useState, FormEvent, ChangeEvent, useEffect, useCallback } from 'react';
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
    Link, IconButton,
    Divider,
    Tooltip,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { DeckSource, fetchDeckData } from '@/app/_utils/fetchDeckData';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { SwuGameFormat, FormatLabels, SupportedDeckSources } from '@/app/_constants/constants';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';
import { DisplayDeck, StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import {
    getUserPayload,
    retrieveDecksForUser,
    saveDeckToLocalStorage,
    saveDeckToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import SWUDeckIcon from '@/app/_components/_sharedcomponents/customIcons/swuDeckIcon';
import { useSession } from 'next-auth/react';

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

interface ICreateGameFormProps {
    deckPreferences: IDeckPreferences;
    deckPreferencesHandlers: IDeckPreferencesHandlers;
    deckLink: string;
    setDeckLink: (value: string) => void;
}

const CreateGameForm: React.FC<ICreateGameFormProps> = ({
    deckPreferences,
    deckPreferencesHandlers,
    deckLink,
    setDeckLink
}) => {
    const router = useRouter();
    const { user } = useUser();
    
    const { showSavedDecks, favoriteDeck, format, saveDeck } = deckPreferences;
    const { setShowSavedDecks, setFavoriteDeck, setFormat, setSaveDeck } = deckPreferencesHandlers;

    // Common State
    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);
    const [privateGame, setPrivateGame] = useState<boolean>(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorTitle, setErrorTitle] = useState<string>('Deck Validation Error');
    const { data: session } = useSession(); // Get session from next-auth
    const formatOptions = Object.values(SwuGameFormat);

    // For a short, user-friendly error message
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);

    // For the raw/technical error details
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | string | undefined>(undefined);

    // Additional State for Non-Creategame Path
    const [lobbyName, setLobbyName] = useState<string>('');

    const searchParams = useSearchParams();
    const undoEnabled = searchParams.get('undoTest') === 'true';

    const handleInitializeDeckSelection = useCallback((firstDeck: string, allDecks: StoredDeck[] | DisplayDeck[]) => {
        let selectDeck = favoriteDeck;
        
        if (favoriteDeck && !allDecks.some(deck => deck.deckID === favoriteDeck)) {
            selectDeck = '';
        }

        if (!selectDeck) {
            selectDeck = firstDeck || '';
        }

        if (selectDeck !== favoriteDeck) {
            setFavoriteDeck(selectDeck);
        }
    }, [favoriteDeck, setFavoriteDeck]);

    const handleDeckManagement = () => {
        router.push('/DeckPage');
    }

    // Load saved decks from localStorage
    const fetchDecks = useCallback(async() => {
        try {
            await retrieveDecksForUser(session?.user, user, { setDecks: setSavedDecks, setFirstDeck: handleInitializeDeckSelection });
        }catch (err){
            console.log(err);
            alert('Server error when fetching decks');
        }
    }, [session?.user, user, handleInitializeDeckSelection]);

    useEffect(() => {
        fetchDecks();
    }, [fetchDecks]);

    // Listen for tab change events to clear errors
    useEffect(() => {
        const handleClearErrors = () => {
            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            setErrorTitle('Deck Validation Error');
        };

        window.addEventListener('clearDeckErrors', handleClearErrors);

        return () => {
            window.removeEventListener('clearDeckErrors', handleClearErrors);
        };
    }, []);
    const handleChangeFormat = (format: SwuGameFormat) => {
        setFormat(format);
    }
    const handleChangeDeckSelectionType = (useSavedDecks: boolean) => {
        setShowSavedDecks(useSavedDecks);
        setDeckErrorSummary(null);
    }
    const handleSelectFavoriteDeck = (deckID: string) => {
        setFavoriteDeck(deckID);
    }

    // Handle Create Game Submission
    const handleCreateGameSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let userDeck;
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
                setErrorTitle('Deck Validation Error');
                setDeckErrorDetails('Incorrect deck format or unsupported deckbuilder.');
                setDeckErrorSummary('Couldn\'t import. Deck is invalid or unsupported deckbuilder');
                setErrorModalOpen(true);
            }
        }catch (error){
            setDeckErrorDetails(undefined);
            if(error instanceof Error){
                if(error.message?.includes('403')) {
                    setDeckErrorSummary('Couldn\'t import. The deck is set to private.');
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorDetails({
                        [DeckValidationFailureReason.DeckSetToPrivate]: true,
                    });
                    setErrorModalOpen(true);
                } else if(error.message?.includes('Deck not found')) {
                    // Handle the specific 404 error messages from any deck source
                    setDeckErrorSummary(error.message);
                    setErrorTitle('Deck Not Found');
                    setDeckErrorDetails(error.message);
                    setErrorModalOpen(true);
                } else {
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                    setErrorModalOpen(true);
                }
            }
            return;
        }
        try {
            // save deck to storage first!
            if (saveDeck && deckData && deckLink){
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
                enableUndo: privateGame && undoEnabled,
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
                    setDeckErrorSummary('You must wait at least 20s before creating a new game.');
                    setErrorTitle('Creation not allowed')
                    setDeckErrorDetails('You left the previous game/lobby abruptly, you can reconnect or wait 20s before starting a new game/lobby. Please use the game/lobby exit buts in the UI and avoid using the back button or closing the browser to leave games.');
                    setErrorModalOpen(true);
                } else if(response.status === 400) {
                    if (result.message?.includes('Invalid game format')) {
                        setErrorTitle('Create Game Error');
                        setDeckErrorDetails(result.message);
                        setDeckErrorSummary(null);
                    } else {
                        setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                        setDeckErrorDetails(errors);
                        setErrorTitle('Deck Validation Error');
                    }
                    setErrorModalOpen(true);
                } else {
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorDetails(errors);
                    setErrorModalOpen(true);
                }
                return;
            }

            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            setErrorTitle('Deck Validation Error');
            router.push('/lobby');
        } catch (error) {
            setDeckErrorSummary('Error creating game.');
            setDeckErrorDetails(undefined);
            setErrorTitle('Server error');
            setErrorModalOpen(true);
        }
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
                                    handleSelectFavoriteDeck(e.target.value as string)
                                }
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
                        {deckErrorSummary && (
                            <Typography variant={'body1'} sx={styles.errorMessageStyle}>
                                {deckErrorSummary}{' '}
                                <Link
                                    sx={styles.errorMessageLink}
                                    onClick={() => setErrorModalOpen(true)}
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
                                    setDeckLink(e.target.value);
                                    setDeckErrorSummary(null);
                                    setDeckErrorDetails(undefined);
                                }}
                            />
                        </FormControl>
                        {deckErrorSummary && (
                            <Typography variant={'body1'} sx={styles.errorMessageStyle}>
                                {deckErrorSummary}{' '}
                                <Link
                                    sx={styles.errorMessageLink}
                                    onClick={() => setErrorModalOpen(true)}
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
                                    checked={saveDeck}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                        checked: boolean
                                    ) => setSaveDeck(checked)}
                                />
                            }
                            label={
                                <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                    Save Deck List
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


                {/* Submit Button */}
                <Button type="submit" variant="contained" sx={styles.submitButtonStyle}>
                    Create Game
                </Button>
            </form>
            <ErrorModal
                open={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                title={errorTitle}
                errors={deckErrorDetails}
                format={format}
            />
        </Box>
    );
};

export default React.memo(CreateGameForm);
