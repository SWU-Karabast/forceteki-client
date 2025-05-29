import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { ChatBubbleOutline } from '@mui/icons-material';
import Resources from '../_subcomponents/PlayerTray/Resources';
import DeckDiscard from '../_subcomponents/PlayerTray/DeckDiscard';
import CardActionTray from '../_subcomponents/PlayerTray/CardActionTray';
import PlayerHand from '../_subcomponents/PlayerTray/PlayerHand';
import { IPlayerCardTrayProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { debugBorder } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';

const PlayerCardTray: React.FC<IPlayerCardTrayProps> = ({ trayPlayer, toggleSidebar }) => {
    const { gameState, connectedPlayer } = useGame();
    const { isPortrait } = useScreenOrientation();

    const activePlayer = gameState.players[connectedPlayer].isActionPhaseActivePlayer;
    const phase = gameState.phase;

    const styles = {
        leftColumnStyle: {
            ...debugBorder('red'),
            display: 'flex',
            flexDirection: isPortrait ? 'column-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isPortrait ? '0.5rem' : '1.0rem',
            gap: '1rem',
            height: '100%',
            boxSizing: 'border-box',
        },
        centerColumnStyle: {
            ...debugBorder('green'),
            display: 'flex',
            alignItems: 'flex-end',
            height: '100%',
        },
        rightColumnStyle: {
            ...debugBorder('red'),
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: { 
                xs: '0.5rem 0.5rem 0.5rem 0', 
                sm: '0.75rem 1rem 0.75rem 0',
                md: '1rem 2rem 1rem 0'
            },
        },
        playerHandWrapper: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: '1',
        },
        chatColumn: {
            ...debugBorder('yellow'),
            display: 'flex',
            alignItems: 'center', 
            alignSelf: 'flex-end', 
            height: { xs: '2.5rem', sm: '3rem', md: '3.8rem' },
            width: 'auto',
            marginBottom: { xs: '0.25rem', md: '0.5rem' }, // Match the padding of actionContainer
        },
        playerTurnAura: {
            height: '100px',
            width: '90%',
            position: 'absolute',
            bottom: '-100px',
            boxShadow: activePlayer === true ? '0px -20px 35px var(--initiative-blue)' : phase === 'regroup' || phase === 'setup' ? '0px -15px 35px rgba(187, 169, 0, 255)' : 'none',
            transition: 'box-shadow .5s',
            borderRadius: '50%',
            left: '0',
            right: '0',
            marginInline: 'auto',
        }
    };

    return (
        <Grid
            container
            sx={{
                height: '100%',
                display: 'flex',
                flexWrap: 'nowrap',
                columnGap: '1rem',
                position: 'relative'
            }}
            className="playerCardTrayWrapper"
        >
            <Grid  
                size={{ xs: 3, md: 3 }}              
                sx={{
                    ...styles.leftColumnStyle,
                }}
            >
                <DeckDiscard trayPlayer={trayPlayer} />
                <Resources trayPlayer={trayPlayer} />
            </Grid>

            {/* Middle column: expands to fill space */}
            <Grid
                size={{ xs: 6, md: 6 }}
                sx={{
                    ...styles.centerColumnStyle,
                }}
            >
                <Box sx={styles.playerHandWrapper}>
                    <PlayerHand
                        allowHover={true}
                        cards={gameState?.players[connectedPlayer].cardPiles['hand'] || []}
                    />
                </Box>
                <Box sx={styles.playerTurnAura} />
            </Grid>            
            <Grid
                size={{ xs: 3, md: 3 }}
                sx={{
                    ...styles.rightColumnStyle,
                }}
            >
                <CardActionTray />
                <Box ml={2} sx={styles.chatColumn}>
                    <ChatBubbleOutline onClick={toggleSidebar} />
                </Box>
            </Grid>
        </Grid>
    );
};

export default PlayerCardTray;