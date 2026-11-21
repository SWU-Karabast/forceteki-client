import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles';

export function extendSx(defaults: SxProps<Theme> | undefined, overrides: SxProps<Theme> | undefined) {
    return [
        ...(Array.isArray(defaults) ? defaults : [defaults]),
        ...(Array.isArray(overrides) ? overrides : [overrides])
    ];
}

