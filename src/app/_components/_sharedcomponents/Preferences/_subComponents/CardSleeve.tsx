import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ISleeve } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';


function CardSleeve(sleeve: ISleeve) {
    const styles = {
        sleeveStyle:{
            backgroundImage: `url(${sleeve.image})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width:'100%',
            height:'9.5rem'
        },
        buttonStyle:{
            border: '1px solid',
            borderColor: '#20344280',
            backgroundColor: sleeve.selected ? '#32506680' : 'transparent',
            display: 'flex',
            height: '13.5rem',
            width: '10.5rem',
            flexDirection: 'column',
            alignItems: 'center',
            '&:hover': {
                backgroundColor: '#32506680', // slightly lighter/darker on hover
                boxShadow: 'none',
            },
        },
        sleeveContainer:{
            width:'100%',
            height: '80%',
        },
        sourceContainer:{
            height:'20%',
            display:'flex',
            alignItems: 'center',
        }
    }

    return (
        <Button sx={styles.buttonStyle} onClick={() => sleeve.onClick}>
            <Box sx={styles.sleeveContainer}>
                <Box sx={styles.sleeveStyle}/>
            </Box>
            <Box sx={styles.sourceContainer}>
                <Typography variant="h4" sx={{ mb:'0px' }}>{sleeve.source}</Typography>
            </Box>
        </Button>
    );
}
export default CardSleeve;
