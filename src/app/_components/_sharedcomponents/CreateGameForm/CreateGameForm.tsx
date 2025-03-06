import React, { useState, FormEvent, ChangeEvent, useRef, useEffect } from 'react';
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
} from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { SwuGameFormat, FormatLabels } from '@/app/_constants/constants';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';

const deckOptions: string[] = [
    'Order66',
    'ThisIsTheWay',
];

// Interface for saved decks
interface StoredDeck {
    leader: { id: string };
    base: { id: string };
    name: string;
    favourite: boolean;
    deckID: string;
    deckLink: string;
}

const CreateGameForm = () => {
    const pathname = usePathname();
    const router = useRouter();
    const isCreateGamePath = pathname === '/creategame';
    const { user } = useUser();

    // Common State
    const [favouriteDeck, setFavouriteDeck] = useState<string>('');
    const [deckLink, setDeckLink] = useState<string>('');
    const [saveDeck, setSaveDeck] = useState<boolean>(false);
    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorTitle, setErrorTitle] = useState<string>('Deck Validation Error');

    const formatOptions = Object.values(SwuGameFormat);
    const savedFormat = localStorage.getItem('format') || SwuGameFormat.Premier;
    const [format, setFormat] = useState<string>(savedFormat);


    // For a short, user-friendly error message
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);

    // For the raw/technical error details
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | string | undefined>(undefined);

    // Additional State for Non-Creategame Path
    const [gameName, setGameName] = useState<string>('');
    const [privacy, setPrivacy] = useState<string>('Public');

    useEffect(() => {
        loadSavedDecks();
    }, []);

    // Load saved decks from localStorage
    const loadSavedDecks = () => {
        try {
            const storedDecks: StoredDeck[] = [];

            // Get all localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Check if this is a deck key
                if (key && key.startsWith('swu_deck_')) {
                    const deckID = key.replace('swu_deck_', '');
                    const deckDataJSON = localStorage.getItem(key);

                    if (deckDataJSON) {
                        const deckData = JSON.parse(deckDataJSON) as StoredDeck;

                        // Add to our list with the ID for reference
                        storedDecks.push({
                            ...deckData,
                            deckID: deckID
                        });
                    }
                }
            }

            // Sort to show favorites first
            const sortedDecks = [...storedDecks].sort((a, b) => {
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;
                return 0;
            });
            setSavedDecks(sortedDecks);
        } catch (error) {
            console.error('Error loading decks from localStorage:', error);
        }
    }
    const handleChangeFormat = (format: SwuGameFormat) => {
        localStorage.setItem('format', format);
        setFormat(format);
    }

    // Handle Create Game Submission
    const handleCreateGameSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        let userDeck = '';
        // check whether the favourite deck was selected or a decklink was used. The decklink always has precedence
        if(favouriteDeck) {
            const selectedDeck = savedDecks.find(deck => deck.deckID === favouriteDeck);
            if (selectedDeck?.deckLink && !deckLink) {
                userDeck = selectedDeck?.deckLink
            }else{
                console.log(deckLink);
                userDeck = deckLink;
            }
        }else{
            userDeck = deckLink;
        }

        let deckData = null
        try {
            const parsedInput = parseInputAsDeckData(userDeck);
            if(parsedInput.type === 'url') {
                deckData = userDeck ? await fetchDeckData(userDeck, false) : null;
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
                if(error.message.includes('Forbidden')) {
                    setDeckErrorSummary('Couldn\'t import. The deck is set to private');
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorDetails({
                        [DeckValidationFailureReason.DeckSetToPrivate]: true,
                    });
                    setErrorModalOpen(true);
                }else{
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                    setErrorModalOpen(true);
                }
            }
            return;
        }
        console.log(deckData);
        try {
            const payload = {
                user: { id: user?.id || localStorage.getItem('anonymousUserId'),
                    username:user?.username || 'anonymous '+ localStorage.getItem('anonymousUserId')?.substring(0,6) },
                deck: deckData,
                isPrivate: privacy === 'Private',
                format: format,
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/create-lobby`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
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
                }else {
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                    setErrorTitle('Deck Validation Error');
                    setDeckErrorDetails(errors);
                    setErrorModalOpen(true);
                }
                return;
            }
            if (saveDeck && deckData && deckLink){
                // save new deck to local storage and only if its a new deck
                try {
                    const deckToSave = {
                        leader: deckData.leader,
                        base: deckData.base,
                        name: deckData.metadata.name,
                        favourite: false,
                        deckID: deckData.deckID,
                        deckLink: deckLink// Store the original link if we have one
                    };
                    localStorage.setItem(`swu_deck_${deckData.deckID}`, JSON.stringify(deckToSave));
                } catch (error) {
                    console.error('Error saving deck to favorites:', error);
                }
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
        }
    }
    return (
        <Box >
            <Typography variant="h2">
                {isCreateGamePath ? 'Choose Your Deck' : 'Create New Game'}
            </Typography>
            <form onSubmit={handleCreateGameSubmit}>
                {/* Favourite Decks Input */}
                <FormControl fullWidth sx={styles.formControlStyle}>
                    <Typography variant="body1" sx={styles.labelTextStyle}>Favourite Decks</Typography>
                    <StyledTextField
                        select
                        value={favouriteDeck}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setFavouriteDeck(e.target.value)
                        }
                        placeholder="Favourite decks"
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
                </FormControl>
                {/* Deck Link Input */}
                <FormControl fullWidth sx={styles.formControlStyle}>
                    <Box sx={styles.labelTextStyle}>
                        <Link href="https://www.swustats.net/" target="_blank" sx={{ color: 'lightblue' }}>
                            SWU Stats
                        </Link>{' '}
                        or{' '}
                        <Link href="https://www.swudb.com/" target="_blank" sx={{ color: 'lightblue' }}>
                            SWUDB
                        </Link>{' '}
                        {/* or{' '}
                        <Link href="https://www.sw-unlimited-db.com/" target="_blank" sx={{ color: 'lightblue' }}>
                            SW-Unlimited-DB
                        </Link>{' '} */}
                        Deck Link{' '}
                        <Typography variant="body1" sx={styles.labelTextStyleSecondary}>
                            (use the URL or &apos;Deck Link&apos; button)
                        </Typography>
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
                </FormControl>

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
                            Save to Favorite Decks
                        </Typography>
                    }
                />

                {/* Additional Fields for Non-Creategame Path */}
                {!isCreateGamePath && (
                    <>
                        {/* Game Name Input
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            <Typography variant="body1" sx={styles.labelTextStyle}>
                                Game Name
                            </Typography>
                            <StyledTextField
                                type="text"
                                value={gameName}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setGameName(e.target.value)
                                }
                                placeholder="Game #"
                            />
                        </FormControl>*/}

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
                        <Typography>
                            {/* Log In to be able to create public games or join a quick game. */}
                        </Typography>
                        {/* Privacy Selection */}
                        <FormControl component="fieldset" sx={styles.formControlStyle}>
                            <RadioGroup
                                row
                                value={privacy}
                                onChange={(
                                    e: ChangeEvent<HTMLInputElement>,
                                    value: string
                                ) => setPrivacy(value)}
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
                    </>
                )}

                {/* Submit Button */}
                <Button type="submit" variant="contained" sx={styles.submitButtonStyle}>
                    Create Game
                </Button>
            </form>
            {/* Secondary Card - Instructions (Only for /creategame path) */}
            {isCreateGamePath && (
                <Box>
                    <Typography variant="h3">
                        Instructions
                    </Typography>
                    <Typography variant="body1">
                        Choose a deck, then click &apos;Create&apos; to be taken to the
                        game lobby.
                        <br />
                        <br />
                        Once in the lobby, the player who wins the dice roll chooses who
                        goes first. Then the host can start the game.
                        <br />
                        <br />
                        Have Fun!
                    </Typography>
                </Box>
            )}
            <ErrorModal
                open={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                title={errorTitle}
                errors={deckErrorDetails}
            />
        </Box>
    );
};

export default CreateGameForm;
