import React, { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { Box, Button, Checkbox, FormControl, FormControlLabel, Link, MenuItem, Typography } from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';
import { IDeckValidationFailures } from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { ErrorModal } from '@/app/_components/_sharedcomponents/Error/ErrorModal';

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

    // error states
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    // For a short, user-friendly error message
    const [deckErrorSummary, setDeckErrorSummary] = useState<string | null>(null);
    // For the raw/technical error details
    const [deckErrorDetails, setDeckErrorDetails] = useState<IDeckValidationFailures | undefined>(undefined);
    // Timer ref for clearing the inline text after 5s
    const errorTextTimer = useRef<NodeJS.Timeout | null>(null);

    const showInlineErrorTextFor5s = () =>{
        if(errorTextTimer.current){
            clearTimeout(errorTextTimer.current);
        }
        errorTextTimer.current = setTimeout(() => {
            setDeckErrorSummary(null);
            errorTextTimer.current = null;
        }, 5000);
    }

    const deckOptions: string[] = [
        'Order66',
        'ThisIsTheWay',
    ];

    // Handle Create Game Submission
    const handleJoinGameQueue = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setQueueState(true);
        console.log('Favourite Deck:', favouriteDeck);
        console.log('Deck Link:', deckLink);
        console.log('beginning fetch for deck link');
        const deckData = deckLink ? await fetchDeckData(deckLink, false) : null;
        console.log('fetch complete, deck data:', deckData);
        console.log('Save Deck To Favourites:', saveDeck);
        try {
            const payload = {
                user: user,
                deck: deckData,
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/enter-queue`,
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
                setQueueState(false);
                setDeckErrorSummary('Deck is invalid.');
                setDeckErrorDetails(errors);
                showInlineErrorTextFor5s();
                return
            }
            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            router.push('/quickGame');
        } catch (error) {
            console.error(error);
            setQueueState(false);
            setDeckErrorSummary('Error creating game.');
            setDeckErrorDetails(undefined);
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
                Choose Your Deck
            </Typography>
            <form onSubmit={handleJoinGameQueue}>
                {/* Favourite Decks Input */}
                <FormControl fullWidth sx={styles.formControlStyle}>
                    <Typography variant="body1" sx={styles.labelTextStyle}>Favourite Decks</Typography>
                    <StyledTextField
                        select
                        value={favouriteDeck}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setFavouriteDeck(e.target.value)
                        }
                        placeholder="Vader Green Ramp"
                    >
                        {deckOptions.map((deck) => (
                            <MenuItem key={deck} value={deck}>
                                {deck}
                            </MenuItem>
                        ))}
                    </StyledTextField>
                </FormControl>

                {/* Deck Link Input */}
                <FormControl fullWidth sx={{ mb: 0 }}>
                    <Box sx={styles.labelTextStyle}>
                        <Link href="https://www.swustats.net/" target="_blank" sx={{ color: 'lightblue' }}>
                            SWU Stats
                        </Link>{' '}
                        or{' '}
                        <Link href="https://www.swudb.com/" target="_blank" sx={{ color: 'lightblue' }}>
                            SWUDB
                        </Link>{' '}
                        or{' '}
                        <Link href="https://www.sw-unlimited-db.com/" target="_blank" sx={{ color: 'lightblue' }}>
                            SW-Unlimited-DB
                        </Link>{' '}
                        Deck Link{' '}
                        <Typography variant="body1" sx={styles.labelTextStyleSecondary}>
                            (use the URL or &apos;Deck Link&apos; button)
                        </Typography>
                    </Box>
                    <StyledTextField
                        type="url"
                        value={deckLink}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setDeckLink(e.target.value)
                        }
                        required
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
                        Choose a deck, then click &apos;Join Queue&apos; to join the queue.
                        <br />
                        <br />
                        Have Fun!
                    </Typography>
                </Box>
            )}
            <ErrorModal
                open={errorModalOpen}
                onClose={() => setErrorModalOpen(false)}
                title="Deck Validation Error"
                errors={deckErrorDetails}
            />
        </Box>
    );
};

export default QuickGameForm;
