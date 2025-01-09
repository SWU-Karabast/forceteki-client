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
import { display } from '@mui/system';

const PlayerCardTray: React.FC<IPlayerCardTrayProps> = ({
    trayPlayer,
    handleModalToggle,
}) => {
    // -------------- Contexts ---------------- //
    const { gameState, connectedPlayer } = useGame();

    // ---------------Styles------------------- //

    const styles = {
        leftColumnStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '1em',
            gap: '10px',
        },
        centerColumnStyle: {
            height: '100%',
        },
        rightColumnStyle: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '1em',
        },
        playerHandWrapper: {
            width: '100%',
            height: '100%',
            transform: 'translateY(15%)',
            transition: 'transform 0.4s ease',
            display : 'flex',
            alignItems : 'center',
            '&:hover': {
                transform: 'translateY(0)',
            },
        },
    }

    return (
        <Grid container sx={{ height: '20.82%' }}>
            <Grid size={3} sx={styles.leftColumnStyle}>
                <DeckDiscard trayPlayer={trayPlayer} />
                <Resources
                    trayPlayer={trayPlayer}
                    handleModalToggle={handleModalToggle}
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
