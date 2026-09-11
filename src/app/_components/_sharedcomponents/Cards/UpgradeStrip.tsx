import type { ICardData } from './CardTypes';
import { Box, BoxProps } from '@mui/material';
import { extendSx } from '@/app/_utils/utils';

export type UpgradeAspect = NonNullable<ICardData['aspects']>[number] | 'neutral';

export interface UpgradeStripProps extends BoxProps {
    aspect: UpgradeAspect;
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

/** Scalable upgrade artwork cropped to its visible 176 × 20 bounds. */
export default function UpgradeStrip({ aspect, sx, ...props }: UpgradeStripProps) {
    const { border, fill } = palette[aspect];

    return (
        <Box sx={extendSx({ background: 'black', py: '1px', px: '6px' }, sx)}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="8 10 176 20"
                aria-hidden="true"
                focusable="false"
                width="100%"
            >
                <path d="M8.125 11H59.375M62.625 11H167.375M170.625 11H173.375M176.625 11H179.375" stroke={border} strokeWidth={2} />
                <path d="M60 11H62M168 11H170M174 11H176M180 11H182" stroke="#d4d4d4" strokeWidth={2} />
                <rect x={8} y={14} width={176} height={16} rx={6} fill={border} />
                <rect x={10} y={16} width={172} height={12} rx={4} fill={fill} />
            </svg>
        </Box>
    );
}
