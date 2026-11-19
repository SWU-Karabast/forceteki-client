import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import type { ITestDeckButtonProps } from './TestDeckButton.types';

// ----------------Styles----------------//
const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        mt: '0.5rem',
    },
    button: {
        textTransform: 'none',
    },
    errorMessage: {
        color: 'var(--initiative-red)',
        fontSize: '0.85rem',
    },
};

/**
 * Development only: fills the deck field with a legal deck for the chosen format and card pool, which the local game
 * server builds from its card data (`GET /api/test-deck`), so testing locally needs no deckbuilder link. The deck
 * arrives as deck JSON, exactly as if it had been pasted. Renders nothing outside development.
 */
const TestDeckButton = ({ format, cardPool, onDeck, disabled = false }: ITestDeckButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    const handleClick = async () => {
        setErrorMessage(null);
        setIsLoading(true);
        try {
            const query = new URLSearchParams({ format, cardPool });
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/test-deck?${query.toString()}`);
            const result = await response.json();
            if (!response.ok) {
                setErrorMessage(result.message ?? `The server could not build a test deck (${response.status})`);
                return;
            }

            onDeck(JSON.stringify(result.deck));
        } catch {
            setErrorMessage('Could not reach the game server for a test deck');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box sx={styles.container}>
            <Button size="small" variant="outlined" onClick={handleClick} disabled={disabled || isLoading} sx={styles.button}>
                Use test deck
            </Button>
            {errorMessage && (
                <Typography variant="body1" sx={styles.errorMessage}>
                    {errorMessage}
                </Typography>
            )}
        </Box>
    );
};

export default TestDeckButton;
