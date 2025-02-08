import { Grid2 as Grid, Box } from '@mui/material';
import { useDragScroll } from '@/app/_utils/useDragScroll';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';
import { IPlayerHandProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';

const PlayerHand: React.FC<IPlayerHandProps> = ({
    cards = [],
    playerNumber,
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
    } = useDragScroll('horizontal');

    const { connectedPlayer } = useGame();

    // ------------------------STYLES------------------------//

    const gridContainerStyle = {
        position: 'relative',
        width: '100%',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
    };

    const cardBoxStyle = {
        display: 'inline-flex',
        gap: '2px',
        overflow: 'hidden',
    };

    const cardStyle = {
        flex: '0 0 auto',
        transition: 'transform 0.2s ease-in-out',
        transform: playerNumber === 1 ? 'translateY(3vh)' : 'translateY(-4vh)',
        '&:hover': {
            transform: playerNumber === 1 ? 'translateY(1.5vh)' : '',
        }
    }

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
                    {cards.map((card, i) => (
                        <Box key={`${connectedPlayer}-hand-${i}`} sx={cardStyle}>
                            <GameCard
                                key={`${connectedPlayer}-hand-${i}`}
                                card={card}/>
                        </Box>
                    ))}
                </Box>
            </Grid>
        </>
    );
};

export default PlayerHand;
