import React from 'react';
import { Box } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';
import { IPlayerHandProps } from '@/app/_components/Gameboard/GameboardTypes';

const PlayerHand: React.FC<IPlayerHandProps> = ({ clickDisabled = false, cards = [], allowHover = false }) => {
    const { connectedPlayer } = useGame();
    const { isPortrait } = useScreenOrientation();

    // 1. Track the container dimensions via ResizeObserver and manual measurements
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = React.useState<number>(0);
    const [containerHeight, setContainerHeight] = React.useState<number>(0);

    // Function to manually measure the container dimensions
    const measureContainerDimensions = React.useCallback(() => {
        if (containerRef.current) {
            // Get the actual rendered dimensions from the DOM
            const actualWidth = containerRef.current.offsetWidth;
            const actualHeight = containerRef.current.offsetHeight;
            if (actualWidth > 0) {
                setContainerWidth(actualWidth);
            }
            if (actualHeight > 0) {
                setContainerHeight(actualHeight);
            }
        }
    }, []);

    // Set up ResizeObserver to track dimension changes
    React.useEffect(() => {
        if (!containerRef.current) return;
        
        // Initial measurement
        measureContainerDimensions();
        
        const ro = new ResizeObserver((entries) => {
            if (entries[0].contentRect) {
                const { width, height } = entries[0].contentRect;
                if (width) setContainerWidth(width);
                if (height) setContainerHeight(height);
            }
        });
        
        ro.observe(containerRef.current);
        
        // Clean up
        return () => ro.disconnect();
    }, [measureContainerDimensions]);
    
    // Measure after initial render and when cards change
    React.useEffect(() => {
        // Use a short timeout to ensure the DOM has updated
        const timer = setTimeout(measureContainerDimensions, 100);
        return () => clearTimeout(timer);
    }, [measureContainerDimensions, cards.length]);

    // We always want to maintain the ratio of the cards width/height = 1/1.4
    const ASPECT_RATIO = 1 / 1.4;
    
    // Calculate card height - use 55% of container height in portrait mode
    const cardHeightPx = isPortrait ? containerHeight * 0.55 : containerHeight;
    
    // Manually scale the card width with aspect ratio for the calculations
    const cardWidthPx = cardHeightPx * ASPECT_RATIO;

    // Gap between cards if no overlap needed
    const GAP_PX = 6;

    // Total width if laid out side-by-side with  gaps included
    const totalNeededWidth =
        cards.length * cardWidthPx + (cards.length - 1) * GAP_PX;

    // Decide whether to overlap should be triggered
    const needsOverlap = totalNeededWidth > containerWidth && cards.length > 1;

    // Overlap in pixel space is determined by total width of cards compared to container width
    let overlapWidthPx = 0;
    if (needsOverlap && cards.length > 1) {
        // Calculate overlap needed to fit all cards in the container width
        overlapWidthPx = ((cards.length * cardWidthPx) - containerWidth) / (cards.length - 1);
    } 
    const containerStyle = {
        // Relative so absolutely-positioned cards can be placed inside.
        position: 'relative' as const,
        width: '100%',
        height: '100%',
    };

    return (
        <>
            {/* Debug Display */}
            <Box
                sx={{
                    position: 'absolute',
                    left: '10px',
                    top: '5px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '5px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    zIndex: 1000,
                    fontFamily: 'monospace',
                    pointerEvents: 'none',
                }}
            >
                <div style={{ lineHeight: '1', marginBottom: '2px' }}>Card Count: {cards.length}</div>
                <div style={{ lineHeight: '1', marginBottom: '2px' }}>Container Width: {containerWidth.toFixed(2)}px</div>
                <div style={{ lineHeight: '1', marginBottom: '2px' }}>Container Height: {containerHeight.toFixed(2)}px</div>
                <div style={{ lineHeight: '1', marginBottom: '2px' }}>Card Height: {cardHeightPx.toFixed(2)}px</div>
                <div style={{ lineHeight: '1', marginBottom: '2px' }}>Card Width: {cardWidthPx.toFixed(2)}px</div>
                <div style={{ lineHeight: '1', marginBottom: '2px' }}>Overlap: {overlapWidthPx.toFixed(2)}px ({((overlapWidthPx / cardWidthPx) * 100).toFixed(1)}%)</div>
                <div style={{ lineHeight: '1', marginBottom: '2px' }}>Needs Overlap: {needsOverlap ? 'Yes' : 'No'}</div>
                <div style={{ lineHeight: '1' }}>Portrait Mode: {isPortrait ? 'Yes' : 'No'}</div>
            </Box>

            <Box
                ref={containerRef}
                sx={containerStyle}
                onWheel={(e) => {
                    e.preventDefault(); // Prevents vertical scrolling
                    e.currentTarget.scrollLeft += e.deltaY; // Converts vertical scroll to horizontal
                }}
            >
                {/* NO OVERLAP SCENARIO */}
                {!needsOverlap ? (
                    // No overlap needed - display cards with even spacing
                    <Box
                        sx={{
                            display: 'flex',
                            gap: `${GAP_PX}px`,
                            width: 'fit-content',
                            margin: '0 auto',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        {cards.map((card, i) => (
                            <Box
                                key={`${connectedPlayer}-hand-${i}`}
                                sx={{
                                    width: 'auto',
                                    height: cardHeightPx,
                                    zIndex: 1,
                                    aspectRatio: '1 / 1.4',
                                    transition: 'transform 0.2s',
                                    transform: card.selected && card.zone === 'hand' ? 'translateY(-11px)' : 'none',
                                    '&:hover': {
                                        transform: allowHover ? 'translateY(-11px)' : 'none',
                                    },
                                }}
                            >
                                <GameCard card={card} disabled={clickDisabled} />
                            </Box>
                        ))}
                    </Box>
                ) : (
                    // Overlap needed - use absolute positioning
                    <Box
                        sx={{
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        {cards.map((card, i) => (
                            <Box
                                key={`${connectedPlayer}-hand-${i}`}
                                sx={{
                                    position: 'absolute',
                                    width: 'auto',
                                    height: cardHeightPx,
                                    aspectRatio: '1 / 1.4',
                                    left: i === 0 ? 0: i * (cardWidthPx - overlapWidthPx),
                                    // Center vertically in portrait mode
                                    top: isPortrait ? `calc(50% - ${cardHeightPx / 2}px)` : 0,
                                    zIndex: i+1,
                                    transition: 'transform 0.2s',
                                    transform: card.selected && card.zone === 'hand' ? 'translateY(-11px)' : 'none',
                                    '&:hover': {
                                        transform: allowHover ? 'translateY(-11px)' : 'none',
                                    },
                                }}
                            >
                                <GameCard card={card} disabled={clickDisabled} />
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </>
    );
};

export default PlayerHand;