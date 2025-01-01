import React, { ChangeEvent, FormEvent, useState } from 'react';
import { Box, Button, Checkbox, FormControl, FormControlLabel, Link, MenuItem, Typography } from '@mui/material';
import StyledTextField from '../_styledcomponents/StyledTextField/StyledTextField';
import { useRouter } from 'next/navigation';
import { mapIdToInternalName, transformDeckWithCardData, updateIdsWithMapping } from '@/app/_utils/s3Utils';
import { useUser } from '@/app/_contexts/User.context';

interface ICreateGameFormProps {
    format?: string | null;
    setFormat?: (format: string) => void;
}

interface IDeckMetadata {
    name: string;
    author: string;
}

interface IDeckCard {
    id: string;
    count: number;
}

interface IDeckData {
    metadata: IDeckMetadata;
    leader: IDeckCard;
    secondleader: IDeckCard | null;
    base: IDeckCard;
    deck: IDeckCard[];
    sideboard: IDeckCard[];
}


const QuickGameForm: React.FC<ICreateGameFormProps> = () => {
    const router = useRouter();
    const { user } = useUser();

    // Common State
    const [favouriteDeck, setFavouriteDeck] = useState<string>('');
    const [deckLink, setDeckLink] = useState<string>('');
    const [saveDeck, setSaveDeck] = useState<boolean>(false);
    const [queueState, setQueueState] = useState<boolean>(false)
    const deckOptions: string[] = [
        'Order66',
        'ThisIsTheWay',
    ];


    const fetchDeckData = async (deckLink: string) => {
        try {
            const response = await fetch(
                `/api/swudbdeck?deckLink=${encodeURIComponent(deckLink)}`
            );
            if (!response.ok) {
                throw new Error(`Failed to fetch deck: ${response.statusText}`);
            }

            const data: IDeckData = await response.json();

            // Fetch setToId mapping from the s3bucket endpoint
            const setCodeMapping = await fetch('/api/s3bucket?jsonFile=_setCodeMap.json'); // Adjust to your actual endpoint if different
            if (!setCodeMapping.ok) {
                throw new Error('Failed to fetch card mapping');
            }

            const jsonData = await setCodeMapping.json();
            const deckWithIds = updateIdsWithMapping(data, jsonData);

            // Fetch codeToInternalname mapping
            const codeInternalnameMapping = await fetch('/api/s3bucket?jsonFile=_cardMap.json'); // Adjust to your actual endpoint if different
            if (!codeInternalnameMapping.ok) {
                throw new Error('Failed to fetch card mapping');
            }

            const codeInternalnameJson = await codeInternalnameMapping.json();
            const deckWithInternalNames = mapIdToInternalName(codeInternalnameJson, deckWithIds)

            // Fetch internalNameToCardMapping
            return await transformDeckWithCardData(deckWithInternalNames)
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error fetching deck:', error.message);
            } else {
                console.error('Unexpected error:', error);
            }
        }
    };

    // Handle Create Game Submission
    const handleJoinGameQueue = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setQueueState(true);
        console.log('Favourite Deck:', favouriteDeck);
        console.log('SWUDB Deck Link:', deckLink);
        console.log('beginning fetch for deck link');
        const deckData = deckLink ? await fetchDeckData(deckLink) : null;
        console.log('fetch complete, deck data:', deckData);
        console.log('Save Deck To Favourites:', saveDeck);
        try {
            const payload = {
                user: user,
                deck: deckData
            };
            const response = await fetch('http://localhost:9500/api/enter-queue',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                setQueueState(false);
                throw new Error('Failed to create game');
            }

            router.push('/quickGame');
        } catch (error) {
            console.error(error);
            setQueueState(false);
        }
    };

    const styles = {
        formControlStyle: {
            mb: '1.5rem',
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

                {/* SWUDB Deck Link Input */}
                <FormControl fullWidth sx={{ mb: 0 }}>
                    <Box sx={styles.labelTextStyle}>
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
                    />
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
        </Box>
    );
};

export default QuickGameForm;
