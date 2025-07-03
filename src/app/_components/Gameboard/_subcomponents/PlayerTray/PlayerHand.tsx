import React from 'react';
import { Box } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';
import { IPlayerHandProps } from '@/app/_components/Gameboard/GameboardTypes';
import { debugBorder, isDebugHandScalingEnabled } from '@/app/_utils/debug';
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';

const PlayerHand: React.FC<IPlayerHandProps> = ({ clickDisabled = false, cards = [], allowHover = false, maxCardOverlapPercent = 0.5, scrollbarEnabled = true }) => {
    const { connectedPlayer } = useGame();
    const { isPortrait } = useScreenOrientation();
    const showDebugInfo = isDebugHandScalingEnabled();
    const customScrollbarStyles = `
        .simplebar-track.simplebar-horizontal {
            height: 1rem !important;
            margin: 0 !important;
            bottom: 0 !important;
            border: 2px solid rgba(91, 104, 110, 0.85) !important;
            background-color: rgba(0, 0, 0, 0.70) !important;
            z-index: 101; !important;
        }
        .custom-scrollbar::before {
            background-color: rgba(91, 104, 110, 0.85) !important;
            
            border-radius: 0 !important;
            opacity: 0.95 !important;
            z-index: 101 !important;
        }
        .simplebar-scrollbar {
            margin: 0 !important;
            right: 0 !important;
            pointer-events: auto !important; /* Ensure scrollbar receives mouse events */
            padding: 0 !important;
        }
        .simplebar-scrollbar:before {
            margin: 0 !important;
            top: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
        }
        .left-gradient {
            position: absolute;
            left: 0;
            top: 0;
            width: 2rem;
            height: 100%;
            background: linear-gradient(to right, rgba(0, 0, 0, 1), transparent);
            pointer-events: none;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .right-gradient {
            position: absolute;
            right: 0;
            top: 0;
            width: 2rem;
            height: 100%;
            background: linear-gradient(to left, rgba(0, 0, 0, 1), transparent);
            pointer-events: none;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
    `;
    
    React.useEffect(() => {
        if (scrollbarEnabled) {
            const styleEl = document.createElement('style');
            styleEl.innerHTML = customScrollbarStyles;
            document.head.appendChild(styleEl);

            return () => {
                if (document.head.contains(styleEl)) {
                    document.head.removeChild(styleEl);
                }
            };
        }
    }, [scrollbarEnabled, customScrollbarStyles]);

    // Refs for gradient elements and scroll container
    const leftGradientRef = React.useRef<HTMLDivElement>(null);
    const rightGradientRef = React.useRef<HTMLDivElement>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = React.useState<number>(0);
    const [containerHeight, setContainerHeight] = React.useState<number>(0);

    const measureContainerDimensions = React.useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            if (rect.width > 0) setContainerWidth(rect.width);
            if (rect.height > 0) setContainerHeight(rect.height);
        }
    }, []);

    React.useEffect(() => {
        if (!containerRef.current) return;
        measureContainerDimensions();
        const ro = new ResizeObserver(measureContainerDimensions);
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [measureContainerDimensions]);
    
    React.useEffect(() => {
        const timer = setTimeout(measureContainerDimensions, 100);
        return () => clearTimeout(timer);
    }, [measureContainerDimensions, cards.length]);

    // We always want to maintain the ratio of the cards width/height = 1/1.4
    const CARD_ASPECT_RATIO = 1 / 1.4;
    const CARD_HOVER_TRANSLATE_PERCENT = 0.075;
    const PORTRAIT_CARD_HEIGHT_PERCENT = 0.75;
    const CARD_GAP_PX = 6;
    
    const cardTranslationPx = containerHeight * CARD_HOVER_TRANSLATE_PERCENT;

    // Calculate card height by offsetting from the translation amount
    const cardHeightPx = containerHeight - cardTranslationPx;
    
    // Manually scale the card width with aspect ratio for the calculations
    const cardWidthPx = cardHeightPx * CARD_ASPECT_RATIO;
    
    // Initialize the gradient visibility on component mount and update their height
    React.useEffect(() => {
        if (!scrollbarEnabled) return;
        
        // Set a small delay to ensure SimpleBar is properly initialized
        const timer = setTimeout(() => {
            if (scrollContainerRef.current && leftGradientRef.current && rightGradientRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
                
                // Initial left gradient state
                leftGradientRef.current.style.opacity = scrollLeft > 0 ? '1' : '0';
                
                // Initial right gradient state
                const isScrolledToEnd = Math.ceil(scrollLeft + clientWidth) >= scrollWidth;
                rightGradientRef.current.style.opacity = isScrolledToEnd ? '0' : '1';
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [scrollbarEnabled, cards.length, cardHeightPx]);

    // Downsize the container width slightly to not trigger the scrollbar on an exact fit
    const adjustedContainerWidth = containerWidth - 2;
   
    // Total width if laid out side-by-side with  gaps included
    const totalNeededWidth =
        cards.length * cardWidthPx + (cards.length - 1) * CARD_GAP_PX;

    // Decide whether to overlap should be triggered
    const needsOverlap = totalNeededWidth > adjustedContainerWidth && cards.length > 1;

    // Overlap in pixel space is determined by total width of cards compared to container width
    let overlapWidthPx = 0;
    if (needsOverlap && cards.length > 1) {
        // Calculate overlap needed to fit all cards in the container width
        overlapWidthPx = ((cards.length * cardWidthPx) - adjustedContainerWidth) / (cards.length - 1);
    } 

    // Cap it by the max ratio 
    overlapWidthPx = Math.min(overlapWidthPx, cardWidthPx * maxCardOverlapPercent);

    const containerStyle = {
        position: 'relative' as const,
        width: '100%',
        height: isPortrait ? `${PORTRAIT_CARD_HEIGHT_PERCENT * 100}%` : '100%',
        margin: isPortrait ? 'auto 0' : '0',
        overflow: 'hidden',
    };

    const HandContent = (
        <React.Fragment>
            {!needsOverlap ? (
                <Box
                    sx={{
                        ...debugBorder('blue'),
                        display: 'flex',
                        gap: `${CARD_GAP_PX}px`,
                        width: '100%',
                        height: '100%',
                        justifyContent: 'center',
                    }}
                >
                    {cards.map((card, i) => (
                        <Box
                            key={`${connectedPlayer}-hand-${i}`}
                            sx={{
                                position: 'relative',
                                width: 'auto',
                                height: cardHeightPx,
                                zIndex: 1,
                                aspectRatio: '1 / 1.4',
                                top: cardTranslationPx,
                                transition: 'transform 0.2s',
                                transform: card.selected && card.zone === 'hand' ? `translateY(-${cardTranslationPx}px)` : 'none',
                                '&:hover': {
                                    transform: allowHover ? `translateY(-${cardTranslationPx}px)` : 'none',
                                },
                            }}
                        >
                            <GameCard card={card} disabled={clickDisabled} overlapEnabled={needsOverlap} />
                        </Box>
                    ))}
                </Box>
            ) : (
                <Box
                    sx={{
                        ...debugBorder('blue'),
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
                                top: cardTranslationPx,
                                zIndex: i + 1,
                                transition: 'transform 0.2s',
                                transform: card.selected && card.zone === 'hand' ? `translateY(-${cardTranslationPx}px)` : 'none',
                                '&:hover': {
                                    transform: allowHover ? `translateY(-${cardTranslationPx}px)` : 'none',
                                },
                            }}
                        >
                            <GameCard card={card} disabled={clickDisabled} overlapEnabled={needsOverlap}/>
                        </Box>
                    ))}
                </Box>
            )}
        </React.Fragment>
    );

    return (
        <React.Fragment>
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
                    ...debugBorder('red')
                }}
            >
                {scrollbarEnabled ? (
                    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
                        <div 
                            ref={leftGradientRef} 
                            className="left-gradient" 
                            style={{ height: `${cardHeightPx}px`, top: cardTranslationPx }}
                        ></div>
                        <div 
                            ref={rightGradientRef} 
                            className="right-gradient" 
                            style={{ height: `${cardHeightPx}px`, top: cardTranslationPx }}
                        ></div>
                        <SimpleBar
                            style={{ width: '100%', height: '100%' }}
                            classNames={{ scrollbar: 'simplebar-scrollbar custom-scrollbar' }}
                            forceVisible="x"
                            onWheel={(e: React.WheelEvent<HTMLElement>) => {
                                e.preventDefault();
                                const target = e.currentTarget.querySelector('.simplebar-content-wrapper') as HTMLElement;
                                if (target) {
                                    target.scrollLeft += e.deltaY;
                                }
                            }}
                            scrollableNodeProps={{
                                ref: (node: HTMLDivElement | null) => {
                                    scrollContainerRef.current = node;
                                },
                                onScroll: (e: React.UIEvent<HTMLDivElement>) => {
                                    // Get scroll information
                                    const scrollElement = e.currentTarget;
                                    const { scrollLeft, scrollWidth, clientWidth } = scrollElement;
                                    
                                    // Show/hide left gradient based on scroll position
                                    if (leftGradientRef.current) {
                                        leftGradientRef.current.style.opacity = scrollLeft > 0 ? '1' : '0';
                                    }
                                    
                                    // Show/hide right gradient based on scroll position
                                    if (rightGradientRef.current) {
                                        const isScrolledToEnd = Math.ceil(scrollLeft + clientWidth) >= scrollWidth;
                                        rightGradientRef.current.style.opacity = isScrolledToEnd ? '0' : '1';
                                    }
                                }
                            }}
                        >
                            {HandContent}
                        </SimpleBar>
                    </Box>
                ) : (
                    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                        {HandContent}
                    </Box>
                )}
            </Box>
        </React.Fragment>
    );
};

export default PlayerHand;