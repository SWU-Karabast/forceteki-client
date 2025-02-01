'use client';
import { Box, Button, Typography } from '@mui/material';
import PreferencesComponent from '@/app/_components/_sharedcomponents/Preferences/PreferencesComponent';
import React from 'react';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid2';

const DeckPage: React.FC = () => {
    // ----------------------Styles-----------------------------//
    const styles = {
        lobbyTextStyle:{
            ml:'30px',
            fontSize: '3.0em',
            fontWeight: '600',
            color: 'white',
            alignSelf: 'flex-start',
            mb: '0px',
            cursor: 'pointer',
        },
        mainContainer:{
            height: '100vh',
            overflow: 'hidden',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display:'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.90rem',
        },
        overlayStyle:{
            padding: '30px',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '3px solid transparent',
            backdropFilter: 'blur(30px)',

            borderRadius:'15px',
            width: '95vw',
            justifySelf:'center',
            height: '81vh',
        },
        header:{
            width: '100%',
            flexDirection: 'row',
            display:'flex',
            justifyContent: 'space-between',
        }
    };

    return (
        <Box sx={styles.mainContainer}>
            <Box sx={styles.overlayStyle}>
                <Box sx={styles.header}>
                    <Box>
                        <Typography>Sort by</Typography>
                    </Box>
                    <Box>
                        <Button>Add New Deck</Button>
                    </Box>
                </Box>
                <Grid container alignItems="center" spacing={1}>
                    
                </Grid>
            </Box>
            <Typography variant="body1" sx={styles.disclaimer}>
                Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                Star Wars characters, cards, logos, and art are property of Disney
                and/or Fantasy Flight Games.
            </Typography>
        </Box>
    );
};

export default DeckPage;
