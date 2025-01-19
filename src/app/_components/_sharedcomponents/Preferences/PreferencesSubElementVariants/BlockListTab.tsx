import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Button, Divider, TextField, Tooltip } from '@mui/material';
import BlockedUser from '@/app/_components/_sharedcomponents/Preferences/_subComponents/BlockedUser';
import { useState } from 'react';

function BlockListTab() {
    const [showTooltip, setShowTooltip] = useState(false);

    // TODO add functionality when we get users
    const handleBlock = () => {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 1000);
    };

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
            fontSize: '2rem',
            fontWeight: '600',
        },
        functionContainer:{
            mb:'3.5rem',
        },
        typeographyStyle:{
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '2rem',
            weight: '600',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'column',
        },
        boxStyle: {
            display: 'flex',
            mt: '1em',
        },
        textFieldStyle: {
            backgroundColor: '#3B4252',
            borderTopLeftRadius:'5px',
            borderBottomLeftRadius:'5px',
            width:'20rem',
            '& .MuiInputBase-input': {
                color: '#fff',
            },
            '& .MuiInputBase-input::placeholder': {
                color: '#fff',
            },
        },
        buttonStyle:{
            backgroundColor: '#2F7DB680',
            ml:'2px',
            borderTopLeftRadius:'0px',
            borderBottomLeftRadius:'0px',
            borderTopRightRadius:'5px',
            borderBottomRightRadius:'5px',

        }
    }

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Box sx={styles.contentContainer}>
                    <Typography>User to block</Typography>
                    <Box sx={styles.boxStyle}>
                        <TextField
                            sx={styles.textFieldStyle}
                            value={''}
                        />
                        <Tooltip
                            open={showTooltip}
                            title="Blocked!"
                            arrow
                            placement="top"
                        >
                            <Button variant="contained" onClick={handleBlock} sx={styles.buttonStyle}>
                                Block
                            </Button>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>
            <Box sx={{ ...styles.functionContainer, mb:'0px' }}>
                <Typography sx={styles.typographyContainer}>Users blocked</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <BlockedUser username={'NastyPlayer32'}/>
                <BlockedUser username={'NastyPlayer32'}/>
                <BlockedUser username={'NastyPlayer32'}/>
                <BlockedUser username={'NastyPlayer32'}/>
                <BlockedUser username={'NastyPlayer32'}/>
            </Box>
        </>
    );
}
export default BlockListTab;
