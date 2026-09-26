import type { ICardData } from './CardTypes';
import { Box, BoxProps } from '@mui/material';
import { extendSx } from '@/app/_utils/utils';

export type UpgradeAspect = NonNullable<ICardData['aspects']>[number] | 'neutral';

export interface UpgradeStripProps extends BoxProps {
    aspect: UpgradeAspect;

    /** Place the accent line below the rectangle. */
    reversed?: boolean;
}

// Colors sampled from the original upgrade-*.png artwork.
const palette: Record<UpgradeAspect, { border: string; fill: string }> = {
    aggression: { border: '#c6191f', fill: '#ecd3c9' },
    command: { border: '#00a44e', fill: '#d2ddd5' },
    cunning: { border: '#f0b535', fill: '#ecdec5' },
    heroism: { border: '#e9e4ce', fill: '#efefef' },
    vigilance: { border: '#299cd7', fill: '#cedfe7' },
    villainy: { border: '#3a3a3a', fill: '#c2b3bd' },
    neutral: { border: '#afafaf', fill: '#e8e8e8' },
};

export default function UpgradeStrip({ aspect, reversed = false, sx, children, ...props }: UpgradeStripProps) {
    const { border, fill } = palette[aspect];

    return (
        <Box {...props} sx={extendSx({ position: 'relative', minWidth: 0, background: 'black', px: '3%', py: '1px' }, sx)}>
            {/* Keep the original artwork proportions: 4 units of accent/gap and 16 of rectangle. */}
            <Box sx={{ display: 'flex', flexDirection: reversed ? 'column-reverse' : 'column', minWidth: 0 }}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="8 9.801 176 3.9204"
                    aria-hidden="true"
                    focusable="false"
                    width="100%"
                    style={{ display: 'block', transform: reversed ? 'scaleY(-1)' : undefined }}
                >
                    <g transform="scale(1 0.9801)">
                        <path d="M8.125 11H59.375M62.625 11H167.375M170.625 11H173.375M176.625 11H179.375" stroke={border} strokeWidth={2} />
                        <path d="M60 11H62M168 11H170M174 11H176M180 11H182" stroke="#d4d4d4" strokeWidth={2} />
                    </g>
                </svg>
                <Box sx={{ position: 'relative', minWidth: 0 }}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="8 13.7214 176 15.6816"
                        aria-hidden="true"
                        focusable="false"
                        width="100%"
                        style={{ display: 'block' }}
                    >
                        <g transform="scale(1 0.9801)">
                            <rect x={8} y={14} width={176} height={16} rx={6} fill={border} />
                            <rect x={10} y={16} width={172} height={12} rx={4} fill={fill} />
                        </g>
                    </svg>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: '2%',
                            right: '2%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            '& > .MuiTypography-root': {
                                flex: '0 1 auto',
                                minWidth: 0,
                                maxWidth: '100%',
                                // The space arena uses RTL for card order, not for card names.
                                direction: 'ltr',
                                textAlign: 'start',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            },
                        }}
                    >
                        {children}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
