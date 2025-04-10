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
    
    // Ensure component is mounted before rendering portal
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);
    
    useEffect(() => {
        try {
            // Try to get the image URL
            const url = s3CardImageURL(card, cardStyle);
            setImageUrl(url);
            setHasError(false);
        } catch (error) {
            console.error('Error getting card image URL:', error);
            setHasError(true);
        }
    }, [card, cardStyle]);
    
    // Fallback image URL (card back)
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
            position: 'fixed', // Changed from absolute to fixed
            zIndex: 9999, // Increased z-index to ensure it's above all other components
            right: 'auto', // Remove fixed right positioning
            left: 'auto', // Will be calculated dynamically
            top: 'auto', // Will be calculated dynamically
            transform: 'none', // Remove transform as we'll position it dynamically
            width: '300px', // Increased width for landscape mode
            height: '216px', // Width / 1.39 to maintain aspect ratio
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            opacity: 0,
            visibility: 'hidden',
            transition: 'opacity 0.2s ease, visibility 0.2s ease',
            pointerEvents: 'none', // Prevent the preview from intercepting mouse events
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
        // Only render the portal on the client side and when component is mounted
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
            document.body // Render directly in the body
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

    // Function to update the position of the preview based on the card's position
    function updatePreviewPosition(e: React.MouseEvent) {
        if (!cardRef.current) return;

        const cardRect = cardRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const previewWidth = 300; // Same as in styles
        const previewHeight = 216; // Same as in styles

        // Calculate position - always to the right of the card
        let left = cardRect.right + 20; // 20px offset from the right edge of the card
        let top = cardRect.top + (cardRect.height / 2) - (previewHeight / 2); // Center vertically with the card

        // Check if preview would go off the right edge of the viewport
        if (left + previewWidth > viewportWidth) {
            // Position to the left of the card instead
            left = cardRect.left - previewWidth - 20;
        }

        // Check if preview would go off the top or bottom of the viewport
        if (top < 0) {
            top = 10; // Add some padding from the top
        } else if (top + previewHeight > viewportHeight) {
            top = viewportHeight - previewHeight - 10; // Add some padding from the bottom
        }

        setPreviewPosition({ left, top });
    }
};

export default CardHoverPreview;
