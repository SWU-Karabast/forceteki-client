import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    const [imageUrl, setImageUrl] = useState<string>('');
    const [hasError, setHasError] = useState(false);
    const [previewPosition, setPreviewPosition] = useState({ left: 0, top: 0 });
    const [isMounted, setIsMounted] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);
    
    useEffect(() => {
        try {
            const url = s3CardImageURL(card, cardStyle);
            setImageUrl(url);
            setHasError(false);
        } catch (error) {
            console.error('Error getting card image URL:', error);
            setHasError(true);
        }
    }, [card, cardStyle]);
    
    const fallbackImageUrl = '/card-back.png';

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
            position: 'fixed',
            zIndex: 9999,
            right: 'auto',
            left: 'auto',
            top: 'auto',
            transform: 'none',
            width: '300px',
            height: '216px',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            opacity: 0,
            visibility: 'hidden',
            transition: 'opacity 0.2s ease, visibility 0.2s ease',
            pointerEvents: 'none',
        },
        largePreviewVisible: {
            opacity: 1,
            visibility: 'visible',
        },
        container: {
            position: 'relative',
        }
    };

    // Create a portal for the preview to render at the root level
    const renderPreview = () => {
        if (!showLargePreview || !isMounted || typeof document === 'undefined') return null;
        
        return createPortal(
            <Box 
                sx={{
                    ...styles.largePreview,
                    ...styles.largePreviewVisible,
                    backgroundImage: `url(${hasError ? fallbackImageUrl : imageUrl})`,
                    left: `${previewPosition.left}px`,
                    top: `${previewPosition.top}px`
                }}
            />,
            document.body
        );
    };

    return (
        <Box sx={styles.container}>
            <Box 
                ref={cardRef}
                sx={{
                    ...styles.cardPreview,
                    backgroundImage: `url(${hasError ? fallbackImageUrl : imageUrl})`
                }}
                title={title || `Card: ${card.id}`}
                onMouseEnter={(e) => {
                    setShowLargePreview(true);
                    updatePreviewPosition(e);
                }}
                onMouseMove={(e) => {
                    if (showLargePreview) {
                        updatePreviewPosition(e);
                    }
                }}
                onMouseLeave={() => setShowLargePreview(false)}
            />
            {renderPreview()}
        </Box>
    );

    function updatePreviewPosition(e: React.MouseEvent) {
        if (!cardRef.current) return;

        const cardRect = cardRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const previewWidth = 300;
        const previewHeight = 216;

        // Calculate position - always to the right of the card
        let left = cardRect.right + 20;
        let top = cardRect.top + (cardRect.height / 2) - (previewHeight / 2);


        if (left + previewWidth > viewportWidth) {
            left = cardRect.left - previewWidth - 20;
        }

        if (top < 0) {
            top = 10;
        } else if (top + previewHeight > viewportHeight) {
            top = viewportHeight - previewHeight - 10;
        }

        setPreviewPosition({ left, top });
    }
};

export default CardHoverPreview;
