import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ICosmeticItem } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';


function CosmeticItem(cosmeticItem: ICosmeticItem) {
    const styles = {
        sleeveStyle:{
            backgroundImage: `url(${cosmeticItem.image})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width:'100%',
            height:'9.5rem'
        },
        buttonStyle:{
            border: '1px solid',
            borderColor: '#20344280',
            backgroundColor: cosmeticItem.selected ? 'rgba(50, 80, 102, 0.2)' : 'transparent',
            display: 'flex',
            height: '13.5rem',
            width: '10.5rem',
            flexDirection: 'column',
            alignItems: 'center',
            '&:hover': {
                backgroundColor: 'rgba(50, 80, 102, 0.2)',
                boxShadow: 'none',
            },
        },
        cosmeticItemContainer:{
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
        <Button sx={styles.buttonStyle} onClick={() => cosmeticItem.onClick(cosmeticItem.name)}>
            <Box sx={styles.cosmeticItemContainer}>
                <Box sx={styles.sleeveStyle}/>
            </Box>
            <Box sx={styles.sourceContainer}>
                <Typography variant="h4" sx={{ mb:'0px' }}>{cosmeticItem.name}</Typography>
            </Box>
        </Button>
    );
}
export default CosmeticItem;
