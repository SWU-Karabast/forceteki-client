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

const PlayerCardTray: React.FC<IPlayerCardTrayProps> = ({
    trayPlayer,
}) => {
    // -------------- Contexts ---------------- //
    const { gameState, connectedPlayer } = useGame();

    // ---------------Styles------------------- //

    const styles = {
        leftColumnStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '1rem 0 1rem 2rem',
            gap: '2rem',
        },
        centerColumnStyle: {
            height: '100%',
        },
        rightColumnStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '1rem 2rem 1rem 0',
            gap: '2rem',
        },
        playerHandWrapper: {
            width: '100%',
            height: '100%',
            display : 'flex',
            alignItems : 'center',
        },
    }

    return (
        <Grid container sx={{ height: '20.82%' }}>
            <Grid size={3} sx={styles.leftColumnStyle}>
                <DeckDiscard trayPlayer={trayPlayer} />
                <Resources
                    trayPlayer={trayPlayer}
                />
            </Grid>
            <Grid size={6} sx={styles.centerColumnStyle}>
                <Box sx={styles.playerHandWrapper}>
                    <PlayerHand cards={gameState?.players[connectedPlayer].cardPiles['hand'] || []} />
                </Box>
            </Grid>
            <Grid size={3} sx={styles.rightColumnStyle}>
                <CardActionTray />
                <Box ml={2}>
                    <ChatBubbleOutline />
                </Box>
            </Grid>
        </Grid>
    );
};

export default PlayerCardTray;
