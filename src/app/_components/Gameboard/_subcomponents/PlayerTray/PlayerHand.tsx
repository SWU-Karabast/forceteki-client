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
        }
        .custom-scrollbar::before {
            background-color: rgb(82, 183, 230) !important;
            height: 1rem !important;
            border-radius: 4px !important;
            border: 2px outset rgb(200, 202, 230) !important;
            opacity: 0.85 !important;
            top: 0 !important;
            bottom: 0 !important;
        }
        .simplebar-scrollbar {
            margin-right: 0 !important;
            right: 0 !important;
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
    };

    const HandContent = (
        <React.Fragment>
            {!needsOverlap ? (
                <Box
                    sx={{
                        ...debugBorder('blue'),
                        display: 'flex',
                        gap: `${CARD_GAP_PX}px`,
                        width: 'fit-content',
                        margin: '0 auto',
                        height: '100%',
                        justifyContent: 'center',
                        alignItems: isPortrait ? 'center' : 'flex-end',
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
                    <SimpleBar
                        style={{ width: '100%', height: '100%' }}
                        classNames={{ scrollbar: 'simplebar-scrollbar custom-scrollbar' }}
                        onWheel={(e: React.WheelEvent<HTMLElement>) => {
                            e.preventDefault();
                            const target = e.currentTarget.querySelector('.simplebar-content-wrapper') as HTMLElement;
                            if (target) {
                                target.scrollLeft += e.deltaY;
                            }
                        }}
                    >
                        {HandContent}
                    </SimpleBar>
                ) : (
                    <Box sx={{ width: '100%', height: '100%', overflowX: 'hidden' }}>
                        {HandContent}
                    </Box>
                )}
            </Box>
        </React.Fragment>
    );
};

export default PlayerHand;