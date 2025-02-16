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
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            padding: '0 0 2rem 2rem',
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
            padding: '0 2rem 2rem 0',
            gap: '2rem',
        },
        playerHandWrapper: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            transform: 'translateY(1rem)',
        },
        chatColumn: {
            display: 'flex',
            alignItems: 'center',
            height: '5.5rem',
            margin: '0',
        },
    };

    return (
        <Grid container sx={{ height: '17%' }} className="playerCardTrayWrapper">
            <Grid size={3} sx={styles.leftColumnStyle} >
                <DeckDiscard trayPlayer={trayPlayer} />
                <Resources trayPlayer={trayPlayer} />
            </Grid>

            <Grid size={6} sx={styles.centerColumnStyle}>
                <Box sx={styles.playerHandWrapper}>
                    <PlayerHand
                        cards={gameState?.players[connectedPlayer].cardPiles['hand'] || []}
                    />
                </Box>
            </Grid>

            <Grid size={3} sx={styles.rightColumnStyle}>
                <CardActionTray />
                <Box ml={2} sx={styles.chatColumn}>
                    <ChatBubbleOutline />
                </Box>
            </Grid>
        </Grid>
    );
};

export default PlayerCardTray;