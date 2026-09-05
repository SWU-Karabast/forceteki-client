import { Typography } from '@mui/material';
import { TokenContainer, type TokenContainerProps } from '../../_styledcomponents/TokenContainer';

export type TokenBadgeType = 'shield' | 'experience' | 'weakness' | 'advantage';

export type TokenBadgeProps = Omit<TokenContainerProps, 'type' | 'children'> & {
    type: TokenBadgeType;
    count: number;
};

/** A token icon and count. Selection and preview behavior belong to the caller. */
export function TokenBadge({ type, count, onClick, sx, ...props }: TokenBadgeProps) {
    return (
        <TokenContainer
            {...props}
            type={type}
            onClick={onClick}
            sx={[
                {
                    fontSize: 'inherit',
                    height: '1.2em',
                    minWidth: '1.2em',
                    padding: '0 0.22em',
                    columnGap: '0.1em',
                    filter: 'drop-shadow(0px 1px 1px rgba(0, 0, 0, 0.55))',
                    cursor: onClick ? 'pointer' : 'default',
                },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <Typography sx={{
                fontSize: '0.95em',
                fontWeight: 700,
                lineHeight: 1,
                color: 'inherit',
                textShadow: '0px 1px 1px rgba(0, 0, 0, 0.35)',
            }}>
                {count}
            </Typography>
        </TokenContainer>
    );
}
