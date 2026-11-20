import React from 'react';
import { Box } from '@mui/material';
import SpectatorIndicator from './SpectatorIndicator';

// ----------------Styles----------------//
const styles = {
    bar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start', // 'flex-end' or 'center' to move the items along the bar
        gap: '0.75em',
        // the same side padding as the chat input above, so the items line up with its edge
        px: { xs: '0.25rem', md: '0.5em' },
        pt: '0.4em',
        fontSize: { xs: '0.8rem', md: '0.75rem' }, // scales everything in the bar
        color: 'rgba(255, 255, 255, 0.6)',
        // a divider from the input; remove for a bar that sits flush under it
        borderTop: '1px solid rgba(255, 255, 255, 0.12)',
        mt: '0.4em',
        '@media (orientation: landscape) and (max-width: 932px)': {
            fontSize: '0.7rem',
            pt: '0.25em',
            mt: '0.25em',
        },
        // takes no space when nothing in it is shown
        '&:empty': {
            display: 'none',
        },
    },
};

/** A thin row under the chat input for game status: for now, how many people are watching. */
const ChatStatusBar: React.FC = () => (
    <Box sx={styles.bar}>
        <SpectatorIndicator />
    </Box>
);

export default ChatStatusBar;
