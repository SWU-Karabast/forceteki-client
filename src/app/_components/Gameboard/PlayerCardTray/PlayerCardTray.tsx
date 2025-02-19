import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
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
    const hasInitiative = gameState.players[connectedPlayer].hasInitiative;
    const initiativeClaimed = gameState.initiativeClaimed;

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
        initiativeWrapper: {
            borderRadius: '20px',
            borderWidth: '2px',
            borderStyle: 'solid',
            height: '2rem',
            width: 'auto',
            background: initiativeClaimed ? 'var(--initiative-blue)' : 'rgba(0, 0, 0, 0.5)',
            borderColor: hasInitiative ? 'var(--initiative-blue)' : 'var(--initiative-red)',
            display: hasInitiative ? 'block' : 'none',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            h4: {
                margin: '0.2rem 1rem 0', 
                textAlign: 'center', 
                display: 'block',
                fontSize: '16px', 
                fontWeight: 600,
                userSelect: 'none',
                color: initiativeClaimed ? 'black' : 'var(--initiative-blue)',
            }
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
                <Box sx={styles.initiativeWrapper}>
                    <Typography variant={'h4'}>Initiative</Typography>
                </Box>
                <CardActionTray />
                <Box ml={2}>
                    <ChatBubbleOutline />
                </Box>
            </Grid>
        </Grid>
    );
};

export default PlayerCardTray;
