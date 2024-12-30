import React from 'react';
import { CloseOutlined, SettingsOutlined } from '@mui/icons-material';
import { Typography, Box, Grid2 as Grid } from '@mui/material';
import Resources from '../_subcomponents/PlayerTray/Resources';
import PlayerHand from '../_subcomponents/PlayerTray/PlayerHand';
import DeckDiscard from '../_subcomponents/PlayerTray/DeckDiscard';
import { IOpponentCardTrayProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';

const OpponentCardTray: React.FC<IOpponentCardTrayProps> = ({ trayPlayer }) => {
    // ---------------Styles------------------- //
    const styles = {
        leftColumn: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            pl: '2em',
            pt: '2em',
        },
        centerColumn: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        },
        rightColumn: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            pr: '2em',
            pt: '2em',
        },
        lastPlayed: {
            border: '2px solid #FFFFFF55'

        },
        menuStyles: {
            display: 'flex',
            flexDirection: 'column',
        }
    };

    const { gameState, connectedPlayer, getOpponent } = useGame();

    return (
        <Grid container sx={{ height: '15%' }}>
            <Grid size={3} sx={styles.leftColumn}>
                <DeckDiscard trayPlayer={trayPlayer} />
                <Box ml={1}>
                    <Resources
                        trayPlayer={trayPlayer}
                    />
                </Box>
            </Grid>
            <Grid size={6} sx={styles.centerColumn}>
                <PlayerHand cards={gameState?.players[getOpponent(connectedPlayer)].cardPiles['hand'] || []} />
            </Grid>
            <Grid size={3} sx={styles.rightColumn}>
                <Box mr={2}>
                    <Typography variant={'h4'}>Initiative</Typography>
                </Box>
                <Box sx={styles.lastPlayed} mr={2}>
                    <Typography variant={'h4'}>Last Played:</Typography>
                </Box>
                <Box sx={styles.menuStyles}>
                    <CloseOutlined />
                    <SettingsOutlined />
                </Box>

            </Grid>
        </Grid>
    );
};

export default OpponentCardTray;
