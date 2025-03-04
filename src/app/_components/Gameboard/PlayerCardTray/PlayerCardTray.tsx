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

const PlayerCardTray: React.FC<IPlayerCardTrayProps> = ({ trayPlayer, toggleSidebar }) => {
    const { gameState, connectedPlayer } = useGame();

    const activePlayer = gameState.players[connectedPlayer].isActionPhaseActivePlayer;
    const phase = gameState.phase;

    const styles = {
        leftColumnStyle: {
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            padding: '1rem 0 1rem 2rem',
            gap: '2rem',
        },
        centerColumnStyle: {
            display: 'flex',
            alignItems: 'flex-end',
            height: '100%',
        },
        rightColumnStyle: {
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '1rem 2rem 1rem 0',
            gap: '2rem',
        },
        playerHandWrapper: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            transform: 'translateY(1.6rem)',
            zIndex: '1',
        },
        chatColumn: {
            display: 'flex',
            alignItems: 'center',
            height: '5.5rem',
            margin: '0',
        },
        playerTurnAura: {
            height: '100px',
            width: '85%',
            position: 'absolute',
            bottom: '-100px',
            boxShadow: activePlayer === true ? '0px -20px 35px var(--initiative-blue)' : phase === 'regroup' || phase === 'setup' ? '0px -15px 35px rgba(216,174,24,255)' : 'none',
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
                height: '17%',
                display: 'flex',
                flexWrap: 'nowrap',
                columnGap: '2rem',  // 2rem gap between columns
            }}
            className="playerCardTrayWrapper"
        >
            {/* Left column: fixed 360px width */}
            <Grid             
                sx={{
                    flex: '0 0 360px',
                    ...styles.leftColumnStyle,
                }}
            >
                <DeckDiscard trayPlayer={trayPlayer} />
                <Resources trayPlayer={trayPlayer} />
            </Grid>

            {/* Middle column: expands to fill space */}
            <Grid
                sx={{
                    flex: 1,
                    ...styles.centerColumnStyle,
                }}
            >
                <Box sx={styles.playerHandWrapper}>
                    <PlayerHand
                        cards={gameState?.players[connectedPlayer].cardPiles['hand'] || []}
                    />
                </Box>
                <Box sx={styles.playerTurnAura} />
            </Grid>

            {/* Right column: fixed 360px width */}
            <Grid
                sx={{
                    flex: '0 0 360px',
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