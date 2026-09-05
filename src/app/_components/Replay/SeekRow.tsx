'use client';
import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

/**
 * A clickable row that a keyboard can reach: Tab lands on it, Enter or Space activates it,
 * and a focus ring shows where you are. Every seek-able list in the replay panel (moves,
 * decisions, digests, recent replays) renders through this, so none of them can be
 * mouse-only again. A nested control (a delete button inside a row) keeps its own keys:
 * the row only reacts to keys aimed at itself.
 */
const SeekRow: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    label?: string;
    sx?: SxProps<Theme>;
    children: React.ReactNode;
}> = ({ onClick, disabled = false, label, sx, children }) => (
    <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={label}
        onClick={disabled ? undefined : onClick}
        onKeyDown={(e) => {
            if (disabled || e.target !== e.currentTarget) return;
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
        }}
        sx={[
            { cursor: disabled ? 'default' : 'pointer', '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: -2 } },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}
    >
        {children}
    </Box>
);

export default SeekRow;
