import React from 'react';
import { Box, Divider, Typography } from '@mui/material';
import PublicMatch from '../PublicMatch/PublicMatch';
import { playerMatches } from '@/app/_constants/mockData';

const GamesInProgress: React.FC = () => {
    const styles = {
        headerBox: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            alignContent: 'center',
            mt: 1,
        },
        divider: {
            mt: '.5vh',
            mb: '1vh',
        },
        activeGamesNumber: {
            fontWeight: 400,
        },
    };

    return (
        <>
            <Box sx={styles.headerBox}>
                <Typography variant="h3">Games in Progress</Typography>
                <Typography variant="h3" sx={styles.activeGamesNumber}>{0}</Typography>
            </Box>
            <Divider sx={styles.divider} />
            { process.env.NODE_ENV === 'development' && 
                <Box>
                    {playerMatches.map((match, index) => (
                        <PublicMatch key={index} match={match} />
                    ))}
                </Box>
            }
        </>
    );
};

export default GamesInProgress;
