// @/app/_utils/keyboardUtils.ts

/**
 * Normalizes raw browser keyboard event keys into standardized string formats
 * used by our database and UI.
 */
export const normalizeKeyBinding = (key: string): string => {
    if (key === ' ') return 'SPACE';
    if (key === 'Control') return 'CTRL';
    if (key === 'Meta') return 'CMD';
    if (key === 'Escape') return 'ESC';
    return key.toUpperCase();
};