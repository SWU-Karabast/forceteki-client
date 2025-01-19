import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { IBlockedUser } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { Button } from '@mui/material';

const BlockedUser:React.FC<IBlockedUser> = ({
    username,
})=>{
    const styles = {
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center',
            mb:'10px'
        },
        typeographyStyle:{
            fontWeight: '500',
            size:'1rem',
            mb:'0px',
            lineHeight:'15.6px',
            color:'#878787',
            ml: '10px',
            width:'15.5rem'
        },
    }

    return (
        <>
            <Box sx={styles.contentContainer}>
                <Typography sx={styles.typeographyStyle}>{username}</Typography>
                <Button variant="contained" >Unblock</Button>
            </Box>
        </>
    );
}
export default BlockedUser;
