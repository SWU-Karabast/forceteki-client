import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Divider, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField/StyledTextField';
import { ChangeEvent, useState } from 'react';
import KeyboardLayout from '@/app/_components/_sharedcomponents/Preferences/_subComponents/KeyboardLayout';

function KeyboardShortcutsTab() {
    const [welcomeMessage, setWelcomeMessage] = useState<string>('');
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer:{
            mb:'1.5rem',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
        },
        keyboardStyle:{
            height: '17rem',
            width: '100%',
            mb:'30px',
        },
        keyPadsStyle:{
            backgroundColor: '#1C2933',
            width: 'fit-content',
            padding: '0.5rem',
            borderRadius: '5px',
            mr:'10px',
            minWidth:'42px',
            textAlign: 'center',
        },
        gridStyle:{
            mt:'20px',
            gap:'20px',
            gridTemplateColumns: 'auto auto auto',
            display:'grid',
        }
    }

    return (
        <>
            <Box sx={styles.functionContainer}>
                <KeyboardLayout />
                <Grid sx={styles.gridStyle}>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>ESC</Typography>
                        </Box>
                        <Typography>Menu</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>Space Bar</Typography>
                        </Box>
                        <Typography>Pass / End turn</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>U</Typography>
                        </Box>
                        <Typography>Undo</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>A</Typography>
                        </Box>
                        <Typography>Concede</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>L</Typography>
                        </Box>
                        <Typography>Leader Ability / Deploy</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>C</Typography>
                        </Box>
                        <Typography>Chat</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>M</Typography>
                        </Box>
                        <Typography>Modal Minimize</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>H</Typography>
                        </Box>
                        <Typography>History</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box sx={styles.keyPadsStyle}>
                            <Typography variant={'h3'}>I</Typography>
                        </Box>
                        <Typography>Claim Initiative</Typography>
                    </Box>
                </Grid>
            </Box>
            <Box sx={styles.functionContainer}>
                <Divider sx={{ mb:'20px' }}/>
                <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                    <Box sx={styles.keyPadsStyle}>
                        <Typography variant={'h3'}>W</Typography>
                    </Box>
                    <Typography sx={{ mb:'0px', mr:'10px' }}>Welcome Message: </Typography>
                    <StyledTextField
                        type="text"
                        value={welcomeMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setWelcomeMessage(e.target.value)
                        }
                        placeholder="Good luck, have fun!"
                        sx={{ width:'50%' }}
                    />
                </Box>
            </Box>
        </>
    );
}
export default KeyboardShortcutsTab;
