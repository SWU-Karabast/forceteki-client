import React from 'react';
import { CloseOutlined, SettingsOutlined } from '@mui/icons-material';
import { Typography, Box, Grid2 as Grid } from '@mui/material';
import Resources from '../_subcomponents/PlayerTray/Resources';
import PlayerHand from '../_subcomponents/PlayerTray/PlayerHand';
import DeckDiscard from '../_subcomponents/PlayerTray/DeckDiscard';
import { IOpponentCardTrayProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation';
import { s3CardImageURL } from '@/app/_utils/s3Utils';

const OpponentCardTray: React.FC<IOpponentCardTrayProps> = ({ trayPlayer, preferenceToggle }) => {
    const { gameState, connectedPlayer, getOpponent, sendManualDisconnectMessage } = useGame();
    const router = useRouter();
    const handleExitButton = () =>{
        sendManualDisconnectMessage();
        router.push('/');
    }

    // ---------------Styles------------------- //
    const styles = {
        leftColumn: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '10px',
            pl: '1em',
        },
        centerColumn: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
        },
        opponentHandWrapper: {
            width: '100%',
            height: '100%',
            transform: 'translateY(-30%)',
        },
        rightColumn: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '15px',
            pr: '1em',
            py: '1em',
        },
        lastPlayed: {
            height: '100%',
            aspectRatio: '359 / 500',
            backgroundSize: 'cover',
            backgroundImage: gameState.clientUIProperties?.lastPlayedCard ? `url(${s3CardImageURL({ setId: gameState.clientUIProperties.lastPlayedCard, type: '', id: '' })})` : 'none',
        },
        menuStyles: {
            display: 'flex',
            flexDirection: 'column',
        }
    };

    return (
        <Grid container sx={{ height: '15%' }}>
            <Grid size={3} sx={styles.leftColumn}>
                <DeckDiscard trayPlayer={trayPlayer} />
                <Resources trayPlayer={trayPlayer}/>
            </Grid>
            <Grid size={6} sx={styles.centerColumn}>
                <Box sx={styles.opponentHandWrapper}>
                    <PlayerHand cards={gameState?.players[getOpponent(connectedPlayer)].cardPiles['hand'] || []} />
                </Box>
            </Grid>
            <Grid size={3} sx={styles.rightColumn}>
                <Typography variant={'h4'}>Initiative</Typography>
                <Box sx={styles.lastPlayed}>
                </Box>
                <Box sx={styles.menuStyles}>
                    <CloseOutlined onClick={handleExitButton} sx={{ cursor:'pointer' }}/>
                    <SettingsOutlined onClick={preferenceToggle} sx={{ cursor:'pointer' }} />
                </Box>

            </Grid>
        </Grid>
    );
};

export default OpponentCardTray;
