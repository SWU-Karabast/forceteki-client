'use client';
import React from 'react';
import { Box } from '@mui/material';
import type { ISeekRowProps } from './ReplayTypes';

/**
 * A clickable row that a keyboard can reach: Tab lands on it, Enter or Space activates it,
 * and a focus ring shows where you are. Every seek-able list in the replay panel (moves,
 * decisions, digests, recent replays) renders through this, so none of them can be
 * mouse-only again. A nested control (a delete button inside a row) keeps its own keys:
 * the row only reacts to keys aimed at itself. `pressed` and `expanded` cover the two rows
 * that toggle rather than seek; the caller's `sx` comes last, so it can override the focus
 * ring's inset.
 */
// Forwards its ref so a `Tooltip` can wrap it: MUI hands the tooltip's anchor ref to its
// child, and a plain function component drops it, leaving the tooltip silently dead.
const SeekRow = React.forwardRef<HTMLDivElement, ISeekRowProps>(function SeekRow(
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
                styles.row(disabled),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            {children}
        </Box>
    );
});

export default SeekRow;

// ----------------Styles----------------//
const styles = {
    row: (disabled: boolean) => ({
        cursor: disabled ? 'default' : 'pointer',
        '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: -2 },
    }),
};
