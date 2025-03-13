import React from 'react';
import { Box } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';
import { IPlayerHandProps } from '@/app/_components/Gameboard/GameboardTypes';

const PlayerHand: React.FC<IPlayerHandProps> = ({ clickDisabled = false, cards = [], allowHover = false }) => {
    const { connectedPlayer } = useGame();

    // 1. Track the container width via ResizeObserver
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = React.useState<number>(0);

    React.useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            if (entries[0].contentRect.width) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // 2. For layout math, assume each card is ~128px wide
    //    (since 8rem typically ≈ 128px if your root font-size is 16px).
    const CARD_WIDTH_PX = 128;

    // 3. Gap between cards if no overlap needed
    const GAP_PX = 6;

    // 4. Total width if laid out side-by-side with a 10px gap
    //    e.g. for 3 cards: totalWidth = 3 * 128 + (3 - 1) * 10
    const totalNeededWidth =
        cards.length * CARD_WIDTH_PX + (cards.length - 1) * GAP_PX;

    // 5. Decide whether to overlap
    const needsOverlap = totalNeededWidth > containerWidth && cards.length > 1;

    // 6. If overlap is needed, calculate how to overlap & center
    //    Overlapped row width = cardWidth + (cards.length - 1) * overlapOffset
    //    We want that to fit exactly in containerWidth, so:
    //    overlapOffset = (containerWidth - cardWidth) / (cards.length - 1)
    let overlapOffset = 0;
    if (needsOverlap) {
        overlapOffset = (containerWidth - CARD_WIDTH_PX) / (cards.length - 1);
    }

    // For centering the overlapped "fan":
    // overlappedWidth = CARD_WIDTH_PX + (cards.length - 1)*overlapOffset
    // leftStart = (containerWidth - overlappedWidth) / 2
    const overlappedWidth =
        CARD_WIDTH_PX + (cards.length - 1) * overlapOffset;
    const overlappedLeftStart = (containerWidth - overlappedWidth) / 2;

    const containerStyle = {
        // Relative so absolutely-positioned cards can be placed inside.
        position: 'relative' as const,
        width: '100%',
        height: '100%',
        // We'll center the no-overlap layout with flex, but conditionally:
        overflow: 'visible hidden'

    };

    return (
        <Box ref={containerRef} sx={containerStyle}
            onWheel={(e) => {
                e.preventDefault(); // Prevents vertical scrolling
                e.currentTarget.scrollLeft += e.deltaY; // Converts vertical scroll to horizontal
            }}>
            {/* NO OVERLAP SCENARIO */}
  
            <Box
                sx={{
                    // A flex row that centers its contents
                    display: 'flex',
                    gap: '6px',
                    width: 'fit-content',
                    margin: '0 auto',
                    // Full height so they're vertically centered
                    height: '100%',
                }}
            >
                {cards.map((card, i) => (
                    <Box
                        key={`${connectedPlayer}-hand-${i}`}
                        sx={{
                            pt: allowHover ? '15px' : 0,
                            width: 'auto',
                            height: '100%',
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


            {/* OVERLAP SCENARIO */}
            {/* {needsOverlap &&
                cards.map((card, i) => (
                    <Box
                        key={`${connectedPlayer}-hand-${i}`}
                        sx={{
                            // Absolutely position each card
                            position: 'absolute',
                            // Visually 8rem wide
                            width: '8rem',
                            // Center vertically
                            top: '50%',
                            // Center horizontally using computed left
                            left: overlappedLeftStart + i * overlapOffset,
                            transition: 'transform 0.2s',
                            transform: card.selected && card.zone === 'hand' ? 'translateY(-50%) translateY(-11px)' : 'translateY(-50%)',
                            '&:hover': {
                                // Slight lift
                                transform: 'translateY(-50%) translateY(-10px)',
                            },
                        }}
                    >
                        <GameCard card={card} disabled={clickDisabled}/>
                    </Box>
                ))} */}
        </Box>
    );
};

export default PlayerHand;