import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const breakpoints = [
    'xxxl',
    'xxl',
    'xl',
    'ipadPro',
    'lg',
    'ipadAir',
    'ipadMini',
    'iphone14max',
    'md',
    'iphone12',
    'iphoneSE',
    'sm',
    'xs',
] as const;

export type BreakpointName = typeof breakpoints[number];

export const useBreakpointName = (): BreakpointName | undefined => {
    const theme = useTheme();

    const matches = {
        xxxl: useMediaQuery(theme.breakpoints.up('xxxl')),
        xxl: useMediaQuery(theme.breakpoints.up('xxl')),
        xl: useMediaQuery(theme.breakpoints.up('xl')),
        ipadPro: useMediaQuery(theme.breakpoints.up('ipadPro')),
        lg: useMediaQuery(theme.breakpoints.up('lg')),
        ipadAir: useMediaQuery(theme.breakpoints.up('ipadAir')),
        ipadMini: useMediaQuery(theme.breakpoints.up('ipadMini')),
        iphone14max: useMediaQuery(theme.breakpoints.up('iphone14max')),
        md: useMediaQuery(theme.breakpoints.up('md')),
        iphone12: useMediaQuery(theme.breakpoints.up('iphone12')),
        iphoneSE: useMediaQuery(theme.breakpoints.up('iphoneSE')),
        sm: useMediaQuery(theme.breakpoints.up('sm')),
        xs: useMediaQuery(theme.breakpoints.up('xs')),
    };
    
    for (const key of breakpoints) {
        if (matches[key]) {
            return key;
        }
    }
    return undefined;
};
