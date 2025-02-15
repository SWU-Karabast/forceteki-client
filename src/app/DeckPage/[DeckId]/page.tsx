import React from 'react';
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import DeckComponent from '@/app/_components/DeckPage/DeckComponent/DeckComponent';


const DeckDetails: React.FC = () => {
    const styles = {
        overlay: {
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        headerRow:{
            width: '100%',
            height: '7%',
            minHeight:'3rem',
        },
        bodyRow:{
            height:'93%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
        },
        deckMeta:{
            width:'30%',
            height:'100%',
        },
        deckGridStyle:{
            width: '70%',
            height: '100%',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        }
    }
    return (
        <>
            <Box sx={styles.headerRow}></Box>
            <Box sx={styles.bodyRow}>
                <Box sx={styles.deckMeta}></Box>
                <Grid sx={styles.deckGridStyle}>
                    <DeckComponent />
                </Grid>
            </Box>
        </>
    )
}

export default DeckDetails;