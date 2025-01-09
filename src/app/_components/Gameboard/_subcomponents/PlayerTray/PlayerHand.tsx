import { Grid2 as Grid, Box } from '@mui/material';
import { useDragScroll } from '@/app/_utils/useDragScroll';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard/GameCard';
import { IPlayerHandProps } from '@/app/_components/Gameboard/GameboardTypes';

const PlayerHand: React.FC<IPlayerHandProps> = ({
    cards = []
}) => {
    const {
        containerRef,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
        isDragging,
        isScrolling,
    } = useDragScroll('horizontal');

    // ------------------------STYLES------------------------//

    const gridContainerStyle = {
        position: 'relative',
        width: '100%',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        scrollbarWidth: 'thin',
        scrollbarColor: isScrolling
            ? '#c4bfbf60 transparent'
            : 'transparent transparent',
        transition: 'scrollbar-color 0.3s ease-in-out',
    };

    const cardBoxStyle = {
        display: 'inline-flex',
        gap: '10px',
    };

    return (
        <>
            <Grid
                container
                justifyContent="center"
                alignItems="center"
                sx={gridContainerStyle}
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <Box sx={cardBoxStyle}>
                    {cards.map((card) => (
                        <Box key={card.uuid} sx={{ flex: '0 0 auto' }}>
                            <GameCard
                                card={card}/>
                        </Box>
                    ))}
                </Box>
            </Grid>
        </>
    );
};

export default PlayerHand;
