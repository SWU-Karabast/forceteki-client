import * as React from 'react';
import Grid from '@mui/material/Grid2';
import CardSleeve from '@/app/_components/_sharedcomponents/Preferences/_subComponents/CardSleeve';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useState } from 'react';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';

function CardSleevesTab() {
    const { user, updateUserPreferences } = useUser();
    const [selectedCardback, setSelectedCardback] = useState<string | null>(null);

    const onSleeveClick = async (source: string) => {
        try {
            console.log(source);
            await savePreferencesGeneric(user, { cardback: source }, updateUserPreferences)
            setSelectedCardback(source);
        }catch (error) {
            console.error('Failed to save cardback preferences:', error);
        }
    }

    useEffect(() => {
        if(user && !selectedCardback){
            setSelectedCardback(user.preferences.cardback ? user.preferences.cardback : 'default');
        }
    }, [user]);

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
        }
    }
    // We loop through all cardbacks and then select the one that the person has chosen
    return (
        <>
            <Grid sx={styles.functionContainer}>
                <CardSleeve image={s3ImageURL('game/swu-cardback.webp')} onClick={() => onSleeveClick('default')} source={'default'} selected={!selectedCardback ? true : selectedCardback === 'default'}/>
                <CardSleeve image={'/Karabast%20team.png'} source={'Karabast team'} onClick={() => onSleeveClick('Karabast%20team.png')} selected={selectedCardback === 'Karabast%20team.png'}/>
            </Grid>
        </>
    );
}
export default CardSleevesTab;
