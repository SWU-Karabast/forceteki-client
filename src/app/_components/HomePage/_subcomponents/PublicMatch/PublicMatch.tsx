import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import GameInProgressPlayer from '../GameInProgressPlayer/GameInProgressPlayer';
import { IPublicGameInProgressProps } from '../../HomePageTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';

const PublicMatch: React.FC<IPublicGameInProgressProps> = ({ match }) => {
    const styles = {
        box: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '2.5rem',
            pl: '10px',
        },
        matchItems: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        matchType: {
            margin: 0,
            mr: '1rem',
        },
        leaderStyleCard:{
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: 'clamp(3rem, 7vw, 10rem)', // Min 5rem, max 10rem, scales with viewport
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer'
        },
        parentBoxStyling: {
            position:'absolute',
        },
    };

    return (
        <Box sx={styles.box}>
            <Box sx={styles.matchItems}>
                <Box sx={{ position:'relative' }}>
                    <Box>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player1Base)})` }}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player1Leader)})` }}/>
                    </Box>
                </Box>
                <Typography variant="body1" sx={styles.matchType}>vs</Typography>
                <Box sx={{ position:'relative' }}>
                    <Box>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player2Base)})` }}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player2Leader)})` }}/>
                    </Box>
                </Box>
            </Box>
            <Button disabled>Spectate</Button>
        </Box>
    );
};

export default PublicMatch;
