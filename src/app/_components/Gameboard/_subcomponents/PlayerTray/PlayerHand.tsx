import React from 'react';
import { Box } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';
import { IPlayerHandProps } from '@/app/_components/Gameboard/GameboardTypes';
import { debugBorder, isDebugHandScalingEnabled } from '@/app/_utils/debug';

const PlayerHand: React.FC<IPlayerHandProps> = ({ clickDisabled = false, cards = [], allowHover = false, maxCardOverlapPercent = 0.5, scrollBarEnabled = true }) => {
    const { connectedPlayer } = useGame();
    const { isPortrait } = useScreenOrientation();
    const showDebugInfo = isDebugHandScalingEnabled();

    // 1. Track the container dimensions via ResizeObserver and manual measurements
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = React.useState<number>(0);
    const [containerHeight, setContainerHeight] = React.useState<number>(0);

    // Function to manually measure the container dimensions
    const measureContainerDimensions = React.useCallback(() => {
        if (containerRef.current) {
            // Use getBoundingClientRect to get the full outer dimensions
            // This gives us the actual size of the element including borders
            // and is not affected by scrollbar presence - perfect for getting
            // the true height regardless of scrollbar presence
            const rect = containerRef.current.getBoundingClientRect();
            
            // Get dimensions from the bounding rectangle
            const actualWidth = rect.width;
            const actualHeight = rect.height;
            
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
        
        const ro = new ResizeObserver(() => {
            // Instead of using contentRect from the observer (which can be affected by scrollbars),
            // we'll use the same getBoundingClientRect method for consistency
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const actualWidth = rect.width;
                const actualHeight = rect.height;
                
                if (actualWidth > 0) setContainerWidth(actualWidth);
                if (actualHeight > 0) setContainerHeight(actualHeight);
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
    const CARD_ASPECT_RATIO = 1 / 1.4;
    const CARD_HOVER_TRANSLATE_PERCENT = 0.10;
    const SCROLLBAR_HEIGHT_PX = 16;
    const CARD_GAP_PX = 6;
    
    // Calculate card height - use 55% of container height in portrait mode
    const cardHeightPx = isPortrait ? containerHeight * 0.55 : containerHeight;
    
    // Manually scale the card width with aspect ratio for the calculations
    const cardWidthPx = cardHeightPx * CARD_ASPECT_RATIO;
   

    // Total width if laid out side-by-side with  gaps included
    const totalNeededWidth =
        cards.length * cardWidthPx + (cards.length - 1) * CARD_GAP_PX;

    // Decide whether to overlap should be triggered
    const needsOverlap = totalNeededWidth > containerWidth && cards.length > 1;

    // Overlap in pixel space is determined by total width of cards compared to container width
    let overlapWidthPx = 0;
    if (needsOverlap && cards.length > 1) {
        // Calculate overlap needed to fit all cards in the container width
        overlapWidthPx = ((cards.length * cardWidthPx) - containerWidth) / (cards.length - 1);
    } 

    // Cap it by the max ratio 
    overlapWidthPx = Math.min(overlapWidthPx, cardWidthPx * maxCardOverlapPercent);

    const containerStyle = {
        // Relative so absolutely-positioned cards can be placed inside.
        position: 'relative' as const,
        width: '100%',
        height: '100%',
    };

    return (
        <>
            {/* Debug Display */}
            {showDebugInfo && <Box
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
            </Box>}

            <Box
                ref={containerRef}
                sx={{
                    ...containerStyle,
                    ...debugBorder('red'),
                    // Allow horizontal scrolling with visible overflow on top
                    overflowX: scrollBarEnabled ? 'auto' : 'hidden',       // horizontal scroll
                    overflowY: 'clip',
                    // Scrollbar styling
                    ...(scrollBarEnabled && {
                        // Firefox scrollbar styling
                        scrollbarWidth: 'thin',
                        scrollbarColor: 'rgba(255, 255, 255, 0.5) #000000',
                        
                        // Webkit scrollbar styling (Chrome, Safari, newer Edge)
                        '&::-webkit-scrollbar': {
                            height: SCROLLBAR_HEIGHT_PX,
                            backgroundColor: '#000000', // Ensure base is black
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(255, 255, 255, 0.5)', // Brighter thumb
                            borderRadius: '4px',
                            border: '1px solid #000000', // Add border to ensure contrast
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: '#000000', // Pure black background
                            borderRadius: '4px',
                        }
                    })
                }}
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
                            gap: `${CARD_GAP_PX}px`,
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
                                    height: '100%',
                                    zIndex: 1,
                                    aspectRatio: '1 / 1.4',
                                    transition: 'transform 0.2s',
                                    transform: card.selected && card.zone === 'hand' ? `translateY(-${cardHeightPx * CARD_HOVER_TRANSLATE_PERCENT}px)` : 'none',
                                    '&:hover': {
                                        transform: allowHover ? `translateY(-${cardHeightPx * CARD_HOVER_TRANSLATE_PERCENT}px)` : 'none',
                                    },
                                }}
                            >
                                <GameCard card={card} disabled={clickDisabled} overlapEnabled={needsOverlap} />
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
                                    transform: card.selected && card.zone === 'hand' ? `translateY(-${cardHeightPx * CARD_HOVER_TRANSLATE_PERCENT}px)` : 'none',
                                    '&:hover': {
                                        transform: allowHover ? `translateY(-${cardHeightPx * CARD_HOVER_TRANSLATE_PERCENT}px)` : 'none',
                                    },
                                }}
                            >
                                <GameCard card={card} disabled={clickDisabled} overlapEnabled={needsOverlap}/>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        </>
    );
};

export default PlayerHand;