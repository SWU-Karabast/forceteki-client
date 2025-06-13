import React from 'react';
import { Typography, Box, Grid2 as Grid } from '@mui/material';
import { debugBorder } from '@/app/_utils/debug';
import UnitsBoard from '../_subcomponents/UnitsBoard';
import { IBoardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';
import { LeaderBaseCardStyle } from '../../_sharedcomponents/Cards/CardTypes';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';

const Board: React.FC<IBoardProps> = ({
    sidebarOpen,
}) => {
    const { gameState, connectedPlayer, isSpectator } = useGame();
    const { isPortrait } = useScreenOrientation();
    const playerIds = Object.keys(gameState.players);

    const opponentId = playerIds.find((id) => id !== connectedPlayer) || '';
    const titleOpponent = gameState.players[opponentId].user.username;
    const titleCurrentPlayer = gameState.players[connectedPlayer].user.username;

    const playerLeader = gameState?.players[connectedPlayer].leader;
    const playerBase = gameState?.players[connectedPlayer].base;
    const opponentLeader = gameState?.players[opponentId].leader;
    const opponentBase = gameState?.players[opponentId].base;

    const hasInitiative = gameState.players[connectedPlayer].hasInitiative;
    const initiativeClaimed = gameState.initiativeClaimed;

    // ----------------Styles----------------//
    const styles = {
        boardWrapper: {
            height: '100%',
            margin: isPortrait ? '0 0.5rem' : '0 2.5rem',
            display: 'flex',
            flexDirection: 'row',
        },
        borderLayer: {
            display: 'flex',
            width: '100%',
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none', // make it invisible to mouse
        },  
        unitsLayer: {
            position: 'relative',
            margin: isPortrait ? '0 0.2em' : '0 1rem',
            width: '100%',
            height: '100%',
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
        columnStyle: {
            position: 'relative',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flex: 1
        },
        middleColumnStyle: {
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            width: isPortrait ? '20%' :
                'clamp(8rem, 20vh, 14rem)',
            margin: isPortrait ? '0 .1rem' : '0 1rem',
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
            ...debugBorder('yellow'),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            gap: 'clamp(1px, 1.0vh, 10px)',
            padding: isPortrait ? '0 .1rem' : '0 1rem',
        },
        leaderBaseWrapper: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
        },
        leftColumnBorderLeft: {
            background: `
            url('border-llt.svg') no-repeat left top,
            url('border-llb.svg') no-repeat left bottom`,
            mixBlendMode: 'soft-light',
            left: '0',
            width: '250px',
            height: '100%',
            position: 'relative',
        },
        leftColumnBorderCenter: {
            flexGrow: 1,
            background: `
            url('border-ct.svg') repeat-x top,
            url('border-cb.svg') repeat-x bottom`,
            mixBlendMode: 'soft-light',
            height: '100%',
            position: 'relative',
        },
        leftColumnBorderRight: {
            background: `
            url('border-lrt.svg') no-repeat right top,
            url('border-lrb.svg') no-repeat right bottom`,
            mixBlendMode: 'soft-light',
            width: '50px',
            right: '0',
            height: '100%',
            position: 'relative',
        },
        rightColumnBorderRight: {
            background: `
            url('border-rrt.svg') no-repeat right top,
            url('border-rrb.svg') no-repeat right bottom`,
            mixBlendMode: 'soft-light',
            right: '0',
            width: '250px',
            height: '100%',
            position: 'relative',
        },
        rightColumnBorderCenter: {
            flexGrow: 1,
            background: `
            url('border-ct.svg') repeat-x top,
            url('border-cb.svg') repeat-x bottom`,
            mixBlendMode: 'soft-light',
            height: '100%',
            position: 'relative',
        },
        rightColumnBorderLeft: {
            background: `
            url('border-rlt.svg') no-repeat left top,
            url('border-rlb.svg') no-repeat left bottom`,
            mixBlendMode: 'soft-light',
            left: '0',
            width: '50px',
            height: '100%',
            position: 'relative',
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
        initiativeWrapper: {
            position: 'absolute',
            right: '5px',
            top : hasInitiative ? '100%' : '5px',
            transform: hasInitiative ? 'translateY(-115%)' : '',
            transition: 'transform .7s, top .7s',
            borderRadius: '20px',
            borderWidth: '2px',
            borderStyle: 'solid',
            height: '2rem',
            width: 'auto',
            background: initiativeClaimed && hasInitiative ? 'var(--initiative-blue)' : initiativeClaimed && !hasInitiative ? 'var(--initiative-red)' : 'rgba(0, 0, 0, 0.5)',
            borderColor: hasInitiative ? 'var(--initiative-blue)' : 'var(--initiative-red)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            h4: {
                margin: '0.2rem 1rem 0', 
                textAlign: 'center',  
                display: 'block',
                fontSize: '1em', 
                fontWeight: 600,
                userSelect: 'none',
                color: !initiativeClaimed && hasInitiative ? 'var(--initiative-blue)' : !initiativeClaimed && !hasInitiative ? 'var(--initiative-red)' : 'black',
            }
        },
    }
    
    return (
        // Boxes containing border styles are doubled to increase the intensity of the 'soft light' blend mode.
        <Box sx={styles.boardWrapper}> 
            <Box sx={styles.columnStyle}>
                <Box sx={styles.borderLayer}>
                    <Box sx={styles.leftColumnBorderLeft} />
                    <Box sx={styles.leftColumnBorderCenter} />
                    <Box sx={styles.leftColumnBorderRight} />
                </Box>
                <Box sx={styles.unitsLayer}>
                    <UnitsBoard sidebarOpen={sidebarOpen} arena="spaceArena" />
                </Box>
            </Box>
            <Box sx={styles.middleColumnStyle}>
                <Box sx={styles.middleColumnBorderLeft} />
                <Box sx={styles.middleColumnBorderRight} />
                <Box sx={styles.middleColumnContent}>
                    <Box sx={styles.leaderBaseContainer}>
                        <Box sx={styles.leaderBaseWrapper}>
                            <LeaderBaseCard
                                card={opponentLeader}
                                cardStyle={LeaderBaseCardStyle.Leader}
                                title={isSpectator ? 'Player2' : titleOpponent}
                                isLeader={true}
                            />
                        </Box>
                        <Box sx={styles.leaderBaseWrapper}>
                            <LeaderBaseCard
                                cardStyle={LeaderBaseCardStyle.Base} 
                                card={opponentBase}
                            />
                        </Box>
                    </Box>
                    <Box sx={{ flex: '0 1 60px', width: '100%' }} />
                    <Box sx={styles.leaderBaseContainer}>
                        <Box sx={styles.leaderBaseWrapper}>
                            <LeaderBaseCard 
                                cardStyle={LeaderBaseCardStyle.Base} 
                                card={playerBase}
                            />
                        </Box>
                        <Box sx={styles.leaderBaseWrapper}>
                            <LeaderBaseCard
                                card={playerLeader}
                                cardStyle={LeaderBaseCardStyle.Leader}
                                title={isSpectator ? 'Player1' : titleCurrentPlayer}
                                isLeader={true}
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Box sx={styles.columnStyle}>
                <Box sx={styles.borderLayer}>
                    <Box sx={styles.rightColumnBorderLeft} />
                    <Box sx={styles.rightColumnBorderCenter} />
                    <Box sx={styles.rightColumnBorderRight} />
                    <Box sx={styles.initiativeWrapper}>
                        <Typography variant={'h4'}>Initiative</Typography>
                    </Box> 
                </Box>
                <Box sx={styles.unitsLayer}>
                    <UnitsBoard
                        sidebarOpen={sidebarOpen} arena="groundArena"
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default Board;
