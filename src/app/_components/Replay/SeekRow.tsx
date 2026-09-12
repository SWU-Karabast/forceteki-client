'use client';
import React from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

/**
 * A clickable row that a keyboard can reach: Tab lands on it, Enter or Space activates it,
 * and a focus ring shows where you are. Every seek-able list in the replay panel (moves,
 * decisions, digests, recent replays) renders through this, so none of them can be
 * mouse-only again. A nested control (a delete button inside a row) keeps its own keys:
 * the row only reacts to keys aimed at itself. `pressed` and `expanded` cover the two rows
 * that toggle rather than seek; the caller's `sx` comes last, so it can override the focus
 * ring's inset.
 */
interface SeekRowProps {
    onClick: () => void;
    disabled?: boolean;
    label?: string;

    /** A row that toggles something on and off (a reveal, a filter) rather than seeking. */
    pressed?: boolean;

    /** A row that opens and closes a detail panel below it. */
    expanded?: boolean;
    sx?: SxProps<Theme>;
    children: React.ReactNode;
}

// Forwards its ref so a `Tooltip` can wrap it: MUI hands the tooltip's anchor ref to its
// child, and a plain function component drops it, leaving the tooltip silently dead.
const SeekRow = React.forwardRef<HTMLDivElement, SeekRowProps>(function SeekRow(
    { onClick, disabled = false, label, pressed, expanded, sx, children, ...rest }, ref,
) {
    return (
        <Box
            ref={ref}
            {...rest}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled || undefined}
            aria-label={label}
            aria-pressed={pressed}
            aria-expanded={expanded}
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
});

export default SeekRow;
