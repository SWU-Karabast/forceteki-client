import React from 'react';
import { Box } from '@mui/material';
import SpectatorIndicator from './SpectatorIndicator';

// ----------------Styles----------------//
const styles = {
    bar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '0.75em',
        px: { xs: '0.25rem', md: '0.5em' },
        pt: '0.4em',
        fontSize: { xs: '0.8rem', md: '0.75rem' },
        color: 'rgba(255, 255, 255, 0.6)',
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        mt: '0.4em',
        '@media (orientation: landscape) and (max-width: 932px)': {
            fontSize: '0.7rem',
            pt: '0.25em',
            mt: '0.25em',
        },
        '&:empty': {
            display: 'none',
        },
    },
};

/** A thin row under the chat input for game status, such as how many people are watching. */
const ChatStatusBar: React.FC = () => (
    <Box sx={styles.bar}>
        <SpectatorIndicator />
    </Box>
);

export default ChatStatusBar;
