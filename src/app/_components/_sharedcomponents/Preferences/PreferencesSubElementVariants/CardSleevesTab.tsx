import * as React from 'react';
import Grid from '@mui/material/Grid2';
import CardSleeve from '@/app/_components/_sharedcomponents/Preferences/_subComponents/CardSleeve';

function CardSleevesTab() {
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
        },
        functionContainer:{
            display:'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(10.5rem, 1fr))',
            rowGap:'14px',
            columnGap:'10px',
            overflowY:'auto',
            maxHeight: 'calc(80vh - 3rem)',
            '::-webkit-scrollbar': {
                width: '0.2vw',
            },
            '::-webkit-scrollbar-thumb': {
                backgroundColor: '#D3D3D3B3',
                borderRadius: '1vw',
            },
            '::-webkit-scrollbar-button': {
                display: 'none',
            },
            transition: 'scrollbar-color 0.3s ease-in-out',
        }
    }

    return (
        <>
            <Grid sx={styles.functionContainer}>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'} selected={true}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
                <CardSleeve image={'/cardSleeve1.png'} source={'default'}/>
            </Grid>
        </>
    );
}
export default CardSleevesTab;
