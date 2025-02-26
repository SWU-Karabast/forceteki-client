import React from 'react';
import { Box, Grid2 as Grid } from '@mui/material';
import UnitsBoard from '../_subcomponents/UnitsBoard';
import { IBoardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';
import { LeaderBaseCardStyle } from '../../_sharedcomponents/Cards/CardTypes';

const Board: React.FC<IBoardProps> = ({
    sidebarOpen,
}) => {
    const { gameState, connectedPlayer } = useGame();
    const playerIds = Object.keys(gameState.players);

    const opponentId = playerIds.find((id) => id !== connectedPlayer) || '';

    const titleOpponent = gameState.players[opponentId].user.username;
    const titleCurrentPlayer = gameState.players[connectedPlayer].user.username;

    const playerLeader = gameState?.players[connectedPlayer].leader;
    const playerBase = gameState?.players[connectedPlayer].base;
    const opponentLeader = gameState?.players[opponentId].leader;
    const opponentBase = gameState?.players[opponentId].base;


    // ----------------Styles----------------//
    const styles = {
        boardWrapper: {
            height: '64.18%',
            margin: '0 5rem',
        },
        containerStyle: {
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center'
        },
        rowStyle: {
            flexGrow: 1,
            width: '100%'
        },
        ColumnStyle: {
            position: 'relative',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
        },
        middleColumnStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: '12rem',
            margin: '0 1rem',
        },
        middleColumnContent: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
            padding: '2rem 0',
        },
        leaderBaseContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: '10px',
        },
        leftColumnBorderLeft: {
            background: `
            url('border-llt.svg') no-repeat left top,
            url('border-llb.svg') no-repeat left bottom`,
            mixBlendMode: 'soft-light',
            width: '80%',
            height: '100%',
            position: 'absolute',
        },
        leftColumnBorderRight: {
            background: `
            url('border-lrt.svg') no-repeat right top,
            url('border-lrb.svg') no-repeat right bottom`,
            mixBlendMode: 'soft-light',
            width: '20%',
            right: '0',
            height: '100%',
            position: 'absolute',
        },
        rightColumnBorderRight: {
            background: `
            url('border-rrt.svg') no-repeat right top,
            url('border-rrb.svg') no-repeat right bottom`,
            mixBlendMode: 'soft-light',
            right: '0',
            width: '80%',
            height: '100%',
            position: 'absolute',
        },
        rightColumnBorderLeft: {
            background: `
            url('border-rlt.svg') no-repeat left top,
            url('border-rlb.svg') no-repeat left bottom`,
            mixBlendMode: 'soft-light',
            width: '20%',
            height: '100%',
            position: 'absolute',
        },
        middleColumnBorderRight: {
            background: `
            url('border-lrt.svg') no-repeat right top,
            url('border-lrb.svg') no-repeat right bottom`,
            mixBlendMode: 'soft-light',
            right: '0',
            width: '20%',
            height: '100%',
            position: 'absolute',
        },
        middleColumnBorderLeft: {
            background: `
            url('border-rlt.svg') no-repeat left top,
            url('border-rlb.svg') no-repeat left bottom`,
            mixBlendMode: 'soft-light',
            left: '0',
            width: '80%',
            height: '100%',
            position: 'absolute',
        },
    }
    
    return (
        // Boxes containing border styles are doubled to increase the intensity of the 'soft light' blend mode.
        <Grid container sx={styles.boardWrapper}> 
            <Grid container size="grow" sx={styles.ColumnStyle}>
                <Box sx={styles.leftColumnBorderLeft} />
                <Box sx={styles.leftColumnBorderRight} />
                <UnitsBoard sidebarOpen={sidebarOpen} arena="spaceArena" />
            </Grid>
            <Grid container sx={styles.middleColumnStyle}>
                <Box sx={styles.middleColumnBorderLeft} />
                <Box sx={styles.middleColumnBorderRight} />
                <Box sx={styles.middleColumnContent}>
                    <Box sx={styles.leaderBaseContainer}>
                        <LeaderBaseCard
                            card={opponentLeader}
                            cardStyle={LeaderBaseCardStyle.Leader}
                            title={titleOpponent}
                        />
                        <LeaderBaseCard cardStyle={LeaderBaseCardStyle.Base} card={opponentBase}></LeaderBaseCard>
                    </Box>
                    <Box sx={styles.leaderBaseContainer}>
                        <LeaderBaseCard cardStyle={LeaderBaseCardStyle.Base} card={playerBase}></LeaderBaseCard>
                        <LeaderBaseCard
                            card={playerLeader}
                            cardStyle={LeaderBaseCardStyle.Leader}
                            title={titleCurrentPlayer}
                        />
                    </Box>
                </Box>
            </Grid>
            <Grid container size="grow" sx={styles.ColumnStyle}>
                <Box sx={styles.rightColumnBorderLeft} />
                <Box sx={styles.rightColumnBorderRight} />
                <UnitsBoard
                    sidebarOpen={sidebarOpen} arena="groundArena"
                />
            </Grid>
        </Grid>
    );
};

export default Board;
