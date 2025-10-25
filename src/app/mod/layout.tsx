import React from 'react';
import { Box, Typography } from '@mui/material';
import { s3ImageURL } from '@/app/_utils/s3Utils';


export default function ModLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ----------------------Styles-----------------------------//
    const styles = {
        mainContainer: {
            height: '100vh',
            overflow: 'hidden',
            backgroundImage: 'url("/default-background.webp")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
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
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.90rem',
        },
    }
    return (
        <Box sx={styles.mainContainer}>
            <Box sx={styles.overlayStyle}>
                {children}
            </Box>
            <Typography variant="body1" sx={styles.disclaimer}>
                Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                Star Wars characters, cards, logos, and art are property of Disney
                and/or Fantasy Flight Games.
            </Typography>
        </Box>
    )
}