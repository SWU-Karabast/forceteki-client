import React from 'react';
import Grid from '@mui/material/Grid2';
import UnitsBoard from '../_subcomponents/UnitsBoard';
import { IBoardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard/LeaderBaseCard';
import { Box, Typography } from '@mui/material';
import CardActionTray from '@/app/_components/Gameboard/_subcomponents/PlayerTray/CardActionTray';

const Board: React.FC<IBoardProps> = ({
    sidebarOpen,
}) => {
    const { gameState, connectedPlayer } = useGame();

    const titleOpponent =
		connectedPlayer === 'th3w4y' ? 'exe66' : 'th3w4y';

    const playerLeader = gameState?.players[connectedPlayer].leader;
    const playerBase = gameState?.players[connectedPlayer].base;
    const opponentLeader = gameState?.players[titleOpponent].leader;
    const opponentBase = gameState?.players[titleOpponent].base;


    // ----------------Styles----------------//
    const styles = {
        leftColumnStyle: {
            justifyContent: 'flex-end',
            alignItems: 'center',
        },
        rightColumnStyle: {
            justifyContent: 'flex-start',
            alignItems: 'center',
        },
        middleColumnStyle: {
            justifyContent: 'center',
            alignItems: 'center',
        },
        middleColumnContent: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column',
            padding: '1em',
        },
        containerStyle: {
            height: '100%',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center'
        },
        leaderBaseContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
        },
        rowStyle: {
            flexGrow: 1,
            width: '100%'
        },
    }
    return (
        <Grid container sx={{ height: '64.18%' }}>
            <Grid container size={5} sx={styles.leftColumnStyle}>
                <UnitsBoard
                    sidebarOpen={sidebarOpen} arena="spaceArena"
                />
            </Grid>
            <Grid container size={2} sx={styles.middleColumnStyle}>
                <Box sx={styles.middleColumnContent}>
                    <Box sx={styles.leaderBaseContainer}>
                        <LeaderBaseCard
                            variant="leader"
                            title={titleOpponent}
                            isLobbyView={false}
                            card={opponentLeader}
                        />
                        <LeaderBaseCard variant="base" isLobbyView={false} card={opponentBase}></LeaderBaseCard>
                    </Box>
                    <Box sx={styles.leaderBaseContainer}>
                        <LeaderBaseCard variant="base" isLobbyView={false} card={playerBase}></LeaderBaseCard>
                        <LeaderBaseCard
                            variant="leader"
                            isLobbyView={false}
                            title={connectedPlayer}
                            card={playerLeader}
                        />
                    </Box>
                </Box>
            </Grid>
            <Grid container size={5} sx={styles.rightColumnStyle}>
                <UnitsBoard
                    sidebarOpen={sidebarOpen} arena="groundArena"
                />
            </Grid>
        </Grid>
    );
};

export default Board;
