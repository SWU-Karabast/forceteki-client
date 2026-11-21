import { Box, type BoxProps } from '@mui/material';

/** Stacks badges along their right edge; the caller positions the stack. */
export function TokenBadgeStack({ children, sx }: Pick<BoxProps, 'children' | 'sx'>) {
    return (
        <Box sx={[
            {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                rowGap: '0.14em',
            },
            ...(Array.isArray(sx) ? sx : [sx]),
        ]}>
            {children}
        </Box>
    );
}
