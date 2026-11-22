import { useState } from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { ITestDeckButtonProps } from './TestDeckButton.types';

// ----------------Styles----------------//
const styles = {
    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        my: '0.5rem',
        // the form's button centres itself with auto margins; in the row, the row places it
        '& > .MuiButton-root': {
            m: 0,
        },
    },
    infoIcon: {
        color: 'lightblue',
        fontSize: '1.1rem',
        cursor: 'help',
    },
    errorMessage: {
        color: 'var(--initiative-red)',
        fontSize: '0.85rem',
        width: '100%',
        textAlign: 'center',
    },
};

/**
 * Development only: shows a button to the right of the form's own submit button (`children`) that gets a legal deck
 * for the chosen format and card pool, which the local game server builds from its card data (`GET /api/test-deck`),
 * and hands it to `onDeck` as deck JSON (exactly what a player could paste) to queue, open a lobby or import with, so
 * testing locally needs no deckbuilder link. Outside development it renders only `children`, unchanged.
 */
const TestDeckButton = ({ format, cardPool, label, tooltip, onDeck, disabled = false, children }: ITestDeckButtonProps) => {
    const [isBusy, setIsBusy] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (process.env.NODE_ENV !== 'development') {
        return <>{children}</>;
    }

    const handleClick = async () => {
        setErrorMessage(null);
        setIsBusy(true);
        try {
            let deckJson: string;
            try {
                const query = new URLSearchParams({ format, cardPool });
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/test-deck?${query.toString()}`);
                const result = await response.json();
                if (!response.ok) {
                    setErrorMessage(result.message ?? `The server could not build a test deck (${response.status})`);
                    return;
                }
                deckJson = JSON.stringify(result.deck);
            } catch {
                setErrorMessage('Could not reach the game server for a test deck');
                return;
            }

            await onDeck(deckJson);
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Box sx={styles.row}>
            {children}
            <Button variant="outlined" onClick={handleClick} disabled={disabled || isBusy}>
                {label}
            </Button>
            <Tooltip arrow title={tooltip}>
                <InfoOutlinedIcon sx={styles.infoIcon} tabIndex={0} aria-label={`About ${label}`} />
            </Tooltip>
            {errorMessage && (
                <Typography variant="body1" sx={styles.errorMessage}>
                    {errorMessage}
                </Typography>
            )}
        </Box>
    );
};

export default TestDeckButton;
