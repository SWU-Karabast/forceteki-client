import { useMediaQuery, useTheme } from '@mui/material';

// The viewport height at or below which the board counts as compact. Most laptop screens fall here once the browser's
// own toolbars are taken off, so this is what tells a "small desktop" apart from a large monitor.
const COMPACT_BOARD_MAX_HEIGHT_PX = 900;

/**
 * Whether the game board should use its compact layouts: on phones and tablets, on laptops, and in any window narrower
 * than the desktopHD breakpoint. Large desktop monitors keep the full layouts.
 *
 * The two-leader (Faux Suns) board uses it to fit both leaders into the space of one card.
 */
export const useIsCompactBoard = (): boolean => {
    const theme = useTheme();
    return useMediaQuery(
        `(orientation: portrait), (max-height: ${COMPACT_BOARD_MAX_HEIGHT_PX}px), (max-width: ${theme.breakpoints.values.desktopHD - 0.05}px)`
    );
};

export default useIsCompactBoard;
