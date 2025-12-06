import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { ICosmeticItem } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';


function CosmeticItem(cosmeticItem: ICosmeticItem) {
    const styles = {
        sleeveStyle:{
            backgroundImage: cosmeticItem.isNoneOption ? 'none' : `url(${cosmeticItem.path})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width:'100%',
            height:'9.5rem',
            backgroundColor: cosmeticItem.isNoneOption ? 'rgba(46, 52, 64, 0.3)' : 'transparent',
            border: cosmeticItem.isNoneOption ? '2px dashed #4C566A' : 'none',
            borderRadius: cosmeticItem.isNoneOption ? '8px' : '0',
            display: cosmeticItem.isNoneOption ? 'flex' : 'block',
            alignItems: cosmeticItem.isNoneOption ? 'center' : 'normal',
            justifyContent: cosmeticItem.isNoneOption ? 'center' : 'normal',
        },
        buttonStyle:{
            border: '1px solid',
            borderColor: '#20344280',
            backgroundColor: cosmeticItem.selected ? 'rgba(50, 80, 102, 0.6)' : 'transparent',
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
        <Button sx={styles.buttonStyle} onClick={() => cosmeticItem.onClick(cosmeticItem.id)}>
            <Box sx={styles.cosmeticItemContainer}>
                <Box sx={styles.sleeveStyle}>
                    {cosmeticItem.isNoneOption && (
                        <Typography
                            variant="body2"
                            sx={{
                                color: '#8892b0',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                fontStyle: 'italic'
                            }}
                        >
                            No Playmat
                        </Typography>
                    )}
                </Box>
            </Box>
            <Box sx={styles.sourceContainer}>
                <Typography variant="h4" sx={{ mb:'0px' }}>{cosmeticItem.title}</Typography>
            </Box>
        </Button>
    );
}
export default CosmeticItem;
