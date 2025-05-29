/**
 * Utility functions for debug features
 */

/**
 * Check if debug borders should be displayed
 * @returns boolean indicating if debug borders are enabled
 */
export const isDebugBordersEnabled = (): boolean => {
    return process.env.NEXT_PUBLIC_DEBUG_BORDERS === 'true';
};

/**
 * Check if breakpoint overlay should be displayed
 * @returns boolean indicating if breakpoint overlay is enabled
 */
export const isBreakpointOverlayEnabled = (): boolean => {
    return process.env.NEXT_PUBLIC_SHOW_BREAKPOINT_OVERLAY === 'true';
};

/**
 * Get a border style if debug borders are enabled
 * @param color The color of the border (e.g. 'red', 'green', 'blue')
 * @returns The border style object or an empty object if debug borders are disabled
 */
export const debugBorder = (color: string): { border: string } | object => {
    return isDebugBordersEnabled() ? { border: `1px dashed ${color}` } : {};
};