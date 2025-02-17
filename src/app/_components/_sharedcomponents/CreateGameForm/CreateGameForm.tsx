import React, { useState, FormEvent, ChangeEvent } from 'react';
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

    // Additional State for Non-Creategame Path
    const [gameName, setGameName] = useState<string>('');
    const [privacy, setPrivacy] = useState<string>(user ? 'Public' : 'Private');

    // Handle Create Game Submission
    const handleCreateGameSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        console.log('Favourite Deck:', favouriteDeck);
        console.log('Deck Link:', deckLink);
        console.log('beginning fetch for deck link');
        const deckData = deckLink ? await fetchDeckData(deckLink,false) : null;
        console.log('fetch complete, deck data:', deckData);
        console.log('Save Deck To Favourites:', saveDeck);
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

            if (!response.ok) {
                throw new Error('Failed to create game');
            }

            router.push('/lobby');
        } catch (error) {
            console.error(error);
        }
    };

    const formControlStyle = {
        mb: '1rem',
    };

    const labelTextStyle = {
        mb: '.5em',
        color: 'white',
    };

    const labelTextStyleSecondary = {
        color: '#aaaaaa',
        display: 'inline',
    };

    const checkboxStyle = {
        color: '#fff',
        '&.Mui-checked': {
            color: '#fff',
        },
    };

    const checkboxAndRadioGroupTextStyle = {
        color: '#fff',
        fontSize: '1em',
    };

    const submitButtonStyle = {
        display: 'block',
        ml: 'auto',
        mr: 'auto',
    };

    return (
        <Box >
            <Typography variant="h2">
                {isCreateGamePath ? 'Choose Your Deck' : 'Create New Game'}
            </Typography>
            <form onSubmit={handleCreateGameSubmit}>
                {/* Favourite Decks Input */}
                {user && <FormControl fullWidth sx={formControlStyle}>
                    <Typography variant="body1" sx={labelTextStyle}>Favourite Decks</Typography>
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
                    <Box sx={labelTextStyle}>
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
                        <Typography variant="body1" sx={labelTextStyleSecondary}>
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
                </FormControl>

                {/* Save Deck To Favourites Checkbox */}
                {user && <FormControlLabel
                    sx={{ mb: '1rem' }}
                    control={
                        <Checkbox
                            sx={checkboxStyle}
                            checked={saveDeck}
                            onChange={(
                                e: ChangeEvent<HTMLInputElement>,
                                checked: boolean
                            ) => setSaveDeck(checked)}
                        />
                    }
                    label={
                        <Typography sx={checkboxAndRadioGroupTextStyle}>
                            Save to Favorite Decks
                        </Typography>
                    }
                />
                }

                {/* Additional Fields for Non-Creategame Path */}
                {!isCreateGamePath && (
                    <>
                        {/* Game Name Input */}
                        <FormControl fullWidth sx={formControlStyle}>
                            <Typography variant="body1" sx={labelTextStyle}>
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
                        <FormControl fullWidth sx={formControlStyle}>
                            <Typography variant="body1" sx={labelTextStyle}>Format</Typography>
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
                        <FormControl component="fieldset" sx={formControlStyle}>
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
                                    control={<Radio sx={checkboxStyle} />}
                                    label={
                                        <Typography sx={checkboxAndRadioGroupTextStyle}>
                                            Public
                                        </Typography>
                                    }
                                />
                                }
                                <FormControlLabel
                                    value="Private"
                                    control={<Radio sx={checkboxStyle} />}
                                    label={
                                        <Typography sx={checkboxAndRadioGroupTextStyle}>
                                            Private
                                        </Typography>
                                    }
                                />
                            </RadioGroup>
                        </FormControl>
                    </>
                )}

                {/* Submit Button */}
                <Button type="submit" variant="contained" sx={submitButtonStyle}>
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
        </Box>
    );
};

export default CreateGameForm;
