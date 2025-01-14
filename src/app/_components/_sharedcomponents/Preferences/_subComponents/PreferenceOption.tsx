import React from 'react';
import { Box } from '@mui/material';
import PreferenceCheckbox from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceCheckbox';
import Typography from '@mui/material/Typography';
import { IPreferenceOptions } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

function PreferenceOption(preferenceOption: IPreferenceOptions) {
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        settingStyle:{
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '16.8px',
            textAlign: 'left',
            width: '11rem',
            textUnderlinePosition: 'from-font',
            textDecorationSkipInk: 'none',
        },
        typeographyStyle:{
            ml: '2rem',
            color: '#878787',
            fontSize: '13px',
            fontWeight: '500',
            lineHeight: '15.6px',
            textAlign: 'left',
            textUnderlinePosition: 'from-font',
            textDecorationSkipInk: 'none',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
        },
    }

    return (
        <Box sx={styles.contentContainer}>
            <PreferenceCheckbox></PreferenceCheckbox>
            <Typography sx={{ ...styles.settingStyle, mb:'0px' }}>{preferenceOption.option}</Typography>
            <Typography sx={styles.typeographyStyle}>
                {preferenceOption.optionDescription}
            </Typography>
        </Box>
    );
}
export default PreferenceOption;