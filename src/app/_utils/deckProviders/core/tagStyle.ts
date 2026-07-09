import type { SxProps, Theme } from '@mui/material';

/**
 * Build the SX block for a deck-source pill from a single accent color.
 * All real provider tags follow this template; per-provider customization
 * is the color only.
 */
export function buildTagStyle(color: string): SxProps<Theme> {
    return {
        borderColor: color,
        color: color,
        '&:hover': {
            backgroundColor: color,
            color: '#000000',
        },
        boxShadow: `0 0 5px ${color}`,
    };
}
