import React, { useState, FormEvent, ChangeEvent, useRef } from 'react';
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
import { IDeckValidationFailures } from '@/app/_validators/DeckValidation/DeckValidationTypes';

interface ICreateGameFormProps {
    format?: string | null;
    setFormat?: (format: string) => void;
}

const deckOptions: string[] = [
    'Order66',
    'ThisIsTheWay',
];

const formatOptions: string[] = ['Premier', 'Twin Suns', 'Draft', 'Sealed'];

const CreateGameForm: React.FC<ICreateGameFormProps> = ({
    format,
    setFormat,
}) => {
    const pathname = usePathname();
    const router = useRouter();
    const isCreateGamePath = pathname === '/creategame';
    const { user } = useUser();

    // Common State
    const [favouriteDeck, setFavouriteDeck] = useState<string>('');
    const [deckLink, setDeckLink] = useState<string>('');
    const [saveDeck, setSaveDeck] = useState<boolean>(false);
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

    // Additional State for Non-Creategame Path
    const [gameName, setGameName] = useState<string>('');
    const [privacy, setPrivacy] = useState<string>(user ? 'Public' : 'Private');

    // Handle Create Game Submission
    const handleCreateGameSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const deckData = deckLink ? await fetchDeckData(deckLink,false) : null;
        try {
            const payload = {
                user: user || sessionStorage.getItem('anonymousUserId'),
                deck: deckData,
                isPrivate: privacy === 'Private',
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
                setDeckErrorSummary('Couldn\'t import, deck is invalid or set to private.');
                setDeckErrorDetails(errors);
                showInlineErrorTextFor5s();
                return;
            }
            setDeckErrorSummary(null);
            setDeckErrorDetails(undefined);
            router.push('/lobby');
        } catch (error) {
            console.error(error);
            setDeckErrorSummary('Error creating game.');
            setDeckErrorDetails(undefined);
            showInlineErrorTextFor5s();
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
                {user && <FormControl fullWidth sx={styles.formControlStyle}>
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
                }
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
                        type="url"
                        value={deckLink}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setDeckLink(e.target.value)
                        }
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
                {user && <FormControlLabel
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
                }

                {/* Additional Fields for Non-Creategame Path */}
                {!isCreateGamePath && (
                    <>
                        {/* Game Name Input */}
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
                        </FormControl>

                        {/* Format Selection */}
                        <FormControl fullWidth sx={styles.formControlStyle}>
                            <Typography variant="body1" sx={styles.labelTextStyle}>Format</Typography>
                            <StyledTextField
                                select
                                value={format}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setFormat ? setFormat(e.target.value) : null
                                }
                                required
                            >
                                {formatOptions.map((fmt) => (
                                    <MenuItem key={fmt} value={fmt}>
                                        {fmt}
                                    </MenuItem>
                                ))}
                            </StyledTextField>
                        </FormControl>
                        <Typography>
                            Log In to be able to create public games or join a quick game.
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
                                {user && <FormControlLabel
                                    value="Public"
                                    control={<Radio sx={styles.checkboxStyle} />}
                                    label={
                                        <Typography sx={styles.checkboxAndRadioGroupTextStyle}>
                                            Public
                                        </Typography>
                                    }
                                />
                                }
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
                title="Deck Validation Error"
                errors={deckErrorDetails}
            />
        </Box>
    );
};

export default CreateGameForm;
