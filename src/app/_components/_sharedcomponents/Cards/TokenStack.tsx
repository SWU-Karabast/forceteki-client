import React from 'react';
import { Box, Typography } from '@mui/material';
import GameCard from '../../_sharedcomponents/Cards/GameCard';
import { CardStyle, ICardData } from '../../_sharedcomponents/Cards/CardTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';

const TokenStack: React.FC<{ cards: ICardData[] }> = ({ cards }) => {
    const locale = useCardImageLocale();
    // The clickable top card is the last one added
    const top = cards[cards.length - 1];

    return (
        <Box sx={{ position: 'relative', mt: '8%', mr: '8%' }}>
            {/* Offset card peeking out behind the top card */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '0.5rem',
                    backgroundImage: `url(${s3CardImageURL(top, locale, CardStyle.InPlay)})`,
                    backgroundSize: 'cover',
                    filter: 'brightness(0.8)',
                    transform: `translate(10%, -10%)${top.exhausted ? ' rotate(4deg)' : ''}`,
                }}
            />
            <Box sx={{ position: 'relative' }}>
                {/* Keyed by uuid so a new top card gets a fresh GameCard */}
                <GameCard key={top.uuid} card={top} subcards={top.subcards} capturedCards={top.capturedCards} cardStyle={CardStyle.InPlay} />
            </Box>
            <Typography
                sx={{
                    position: 'absolute',
                    top: '-6%',
                    left: '-6%',
                    zIndex: 3,
                    px: '0.35em',
                    borderRadius: '45%',
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    border: '1.5px solid white',
                    color: 'white',
                    fontSize: 'clamp(0.55rem, 1.1vw, 1rem)',
                    fontWeight: 800,
                    pointerEvents: 'none',
                }}
            >
                ×{cards.length}
            </Typography>
        </Box>
    );
};

export default TokenStack;