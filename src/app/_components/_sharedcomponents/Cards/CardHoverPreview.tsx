import React, { useState } from 'react';
import { Box } from '@mui/material';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle, ISetCode, LeaderBaseCardStyle } from './CardTypes';

interface CardHoverPreviewProps {
    card: ISetCode;
    cardStyle?: CardStyle | LeaderBaseCardStyle;
    title?: string;
    sx?: React.CSSProperties | Record<string, unknown>;
}

const CardHoverPreview: React.FC<CardHoverPreviewProps> = ({ 
    card, 
    cardStyle = CardStyle.Plain, 
    title,
    sx = {}
}) => {
    const [showLargePreview, setShowLargePreview] = useState(false);

    const styles = {
        cardPreview: {
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: 'clamp(3rem, 7vw, 10rem)',
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer',
            ...sx
        },
        largePreview: {
            position: 'absolute',
            zIndex: 1000,
            right: '-320px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '300px', // Increased width for landscape mode
            height: '216px', // Width / 1.39 to maintain aspect ratio
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            opacity: 0,
            visibility: 'hidden',
            transition: 'opacity 0.2s ease, visibility 0.2s ease',
        },
        largePreviewVisible: {
            opacity: 1,
            visibility: 'visible',
        },
        container: {
            position: 'relative',
        }
    };

    return (
        <Box sx={styles.container}>
            <Box 
                sx={{
                    ...styles.cardPreview,
                    backgroundImage: `url(${s3CardImageURL(card, cardStyle)})`
                }}
                title={title || `Card: ${card.id}`}
                onMouseEnter={() => setShowLargePreview(true)}
                onMouseLeave={() => setShowLargePreview(false)}
            />
            <Box 
                sx={{
                    ...styles.largePreview,
                    ...(showLargePreview ? styles.largePreviewVisible : {}),
                    backgroundImage: `url(${s3CardImageURL(card, cardStyle)})`
                }}
            />
        </Box>
    );
};

export default CardHoverPreview;
