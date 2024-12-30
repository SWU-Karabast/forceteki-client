import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import GameInProgressPlayer from '../GameInProgressPlayer/GameInProgressPlayer';
import { IPublicGameInProgressProps } from '../../HomePageTypes';

const PublicMatch: React.FC<IPublicGameInProgressProps> = ({ match }) => {
    const styles = {
        box: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '1rem',
        },
        matchItems: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        matchType: {
            margin: 0,
        },
    };

    return (
        <Box sx={styles.box}>
            <Box sx={styles.matchItems}>
                <GameInProgressPlayer
                    playerImage={match.player1.playerImage}
                />
                <Typography variant="body1" sx={styles.matchType}>vs</Typography>
                <GameInProgressPlayer
                    playerImage={match.player2.playerImage}
                />
            </Box>
            <Button>Spectate</Button>
        </Box>
    );
};

export default PublicMatch;
