import React, { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { Box, Button, Checkbox, FormControl, FormControlLabel, Link, MenuItem, Typography } from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import {
    DeckValidationFailureReason,
    IDeckValidationFailures
} from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';
import { FormatLabels, SwuGameFormat } from '@/app/_constants/constants';
import { parseInputAsDeckData } from '@/app/_utils/checkJson';
import { StoredDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import {
    getUserPayload,
    retrieveDecksForUser,
    saveDeckToLocalStorage,
    saveDeckToServer
} from '@/app/_utils/DeckStorageUtils';

interface ICreateGameFormProps {
    format?: string | null;
    setFormat?: (format: string) => void;
}

const QuickGameForm: React.FC<ICreateGameFormProps> = () => {
    const router = useRouter();
    const { user } = useUser();

    // Common State
    const [favouriteDeck, setFavouriteDeck] = useState<string>('');
    const [deckLink, setDeckLink] = useState<string>('');
    const [saveDeck, setSaveDeck] = useState<boolean>(false);
    const [queueState, setQueueState] = useState<boolean>(false)
    const [savedDecks, setSavedDecks] = useState<StoredDeck[]>([]);

    const formatOptions = Object.values(SwuGameFormat);    
    const savedFormat = localStorage.getItem('format') || SwuGameFormat.Premier;
    const [format, setFormat] = useState<string>(savedFormat);

    // error states
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    // For a short, user-friendly error message
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);
    // For the raw/technical error details
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | string | undefined>(undefined);
    const [errorTitle, setErrorTitle] = useState<string>('Deck Validation Error');
    // Timer ref for clearing the inline text after 5s

    // Load saved decks when component mounts
    useEffect(() => {
        fetchDecks();
    }, [user]);


    // Load saved decks from localStorage
    const fetchDecks = async () => {
        try {
            await retrieveDecksForUser(user,{ setDecks: setSavedDecks, setFirstDeck: setFavouriteDeck });
        }catch (err) {
            console.log(err);
            alert('Server error when fetching decks');
        }
    };

    const handleChangeFormat = (format: SwuGameFormat) => {
        localStorage.setItem('format', format);
        setFormat(format);
    }

    // Handle Create Game Submission
    const handleJoinGameQueue = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setQueueState(true);
        // Get the deck link - either from selected favorite or direct input
        let userDeck = '';
        if(favouriteDeck) {
            const selectedDeck = savedDecks.find(deck => deck.deckID === favouriteDeck);
            if (selectedDeck?.deckLink && !deckLink) {
                userDeck = selectedDeck.deckLink;
            } else {
                userDeck = deckLink;
            }
        } else {
            userDeck = deckLink;
        }
        let deckData = null
        try {
            const parsedInput = parseInputAsDeckData(userDeck);
            if(parsedInput.type === 'url') {
                deckData = userDeck ? await fetchDeckData(userDeck, false) : null;
                if(favouriteDeck && deckData && !deckLink) {
                    deckData.deckID = favouriteDeck
                }
            }else if(parsedInput.type === 'json') {
                deckData = parsedInput.data
            }else{
                setQueueState(false);
                setDeckErrorSummary('Couldn\'t import. Deck is invalid or unsupported deckbuilder');
                setDeckErrorDetails('Incorrect deck format or unsupported deckbuilder.');
                setErrorModalOpen(true);
                return;
            }
        }catch (error){
            setQueueState(false);
            setDeckErrorDetails(undefined);
            if(error instanceof Error){
                if(error.message.includes('403')) {
                    setDeckErrorSummary('Couldn\'t import. The deck is set to private');
                    setDeckErrorDetails({
                        [DeckValidationFailureReason.DeckSetToPrivate]: true,
                    });
                    setErrorTitle('Deck Validation Error');
                    setErrorModalOpen(true);
                }else{
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                    setErrorTitle('Deck Validation Error');
                    setErrorModalOpen(true);
                }
            }
            return;
        }
        try {
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
                if(response.status === 403) {
                    setQueueState(false)
                    setDeckErrorSummary('You must wait at least 20s before creating a new game.');
                    setErrorTitle('Matchmaking not allowed')
                    setDeckErrorDetails('You left the previous game/lobby abruptly or are still in one. You can reconnect or wait 20s before starting a new game/lobby. Please use the game/lobby exit buttons in the UI and avoid using the back button or closing the browser to leave games.')
                    setErrorModalOpen(true);
                }else if(response.status === 400) {
                    setQueueState(false);
                    setDeckErrorSummary('Couldn\'t import. Deck is invalid.');
                    setDeckErrorDetails(errors);
                    setErrorTitle('Deck Validation Error');
                    setErrorModalOpen(true);
                } else {
                    setQueueState(false);
                    setDeckErrorSummary('Server error, please try again. If the issue persists, please let us know in the Karabast discord.');
                    setDeckErrorDetails(errors);
                    setErrorTitle('Matchmaking Error');
                    setErrorModalOpen(true);
                }
                return
            }
            // Save the deck if needed
            if (saveDeck && deckData && userDeck) {
                if(user) {
                    await saveDeckToServer(deckData, deckLink, user);
                }else{
                    saveDeckToLocalStorage(deckData, deckLink);
                }
            }

            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            setErrorTitle('Deck Validation Error');
            router.push('/quickGame');
        } catch (error) {
            setQueueState(false);
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
            mt: '5px',
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
                Join Matchmaking Queue
            </Typography>
            <form onSubmit={handleJoinGameQueue}>
                {/* Favourite Decks Input */}
                <FormControl fullWidth sx={styles.formControlStyle}>
                    <Typography variant="body1" sx={styles.labelTextStyle}>Favorite decks</Typography>
                    <StyledTextField
                        select
                        value={favouriteDeck}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setFavouriteDeck(e.target.value)
                        }
                        placeholder="Favorite decks"
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
                        /{' '}
                        <Link href="https://www.swudb.com/" target="_blank" sx={{ color: 'lightblue' }}>
                            SWUDB
                        </Link>{' '}
                        /{' '}
                        <Link href="https://sw-unlimited-db.com/" target="_blank" sx={{ color: 'lightblue' }}>
                            SW-Unlimited-DB
                        </Link>{' '}
                        Deck Link{' '}
                        <br />
                        OR paste deck JSON directly
                    </Box>
                    <StyledTextField
                        type="text"
                        value={deckLink}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
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

                <Box>
                    <Typography variant="body1" color="yellow">
                        Next Set Preview format is now available for Quick Match!
                    </Typography>
                </Box>

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
            {/* Secondary Card - Instructions (Only for /creategame path) */}
            {(
                <Box>
                    <Typography variant="h3">
                        Instructions
                    </Typography>
                    <Typography variant="body1">
                        Choose a deck, then click &apos;Join Queue&apos; to join the matchmaking queue.
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

export default QuickGameForm;
