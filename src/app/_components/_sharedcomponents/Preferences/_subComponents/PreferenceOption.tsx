import React from 'react';
import { Box } from '@mui/material';
import PreferenceCheckbox from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceCheckbox';
import Typography from '@mui/material/Typography';
import { IPreferenceOptions } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import StyledMuteButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/StyledMuteButton';

interface PreferenceOptionWithIconProps extends IPreferenceOptions {
    iconType?: 'checkbox' | 'mute';
    onChange?: (value: boolean) => void;
    defaultChecked?: boolean;
    disabled?: boolean;
}

function PreferenceOptionWithIcon({
    option,
    optionDescription,
    iconType = 'checkbox',
    onChange,
    defaultChecked = false,
    disabled = false
}: PreferenceOptionWithIconProps) {
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        settingStyle: {
            ml: '1rem',
            fontSize: '1.2rem',
            fontWeight: '600',
            lineHeight: '16.8px',
            textAlign: 'left',
            width: '11rem',
            textUnderlinePosition: 'from-font',
            textDecorationSkipInk: 'none',
            opacity: disabled ? 0.5 : 1,  // Visual indication when disabled
        },
        typeographyStyle: {
            ml: '2rem',
            color: disabled ? '#c0c0c0' : '#878787',  // Lighter color when disabled
            fontSize: '1rem',
            fontWeight: '500',
            lineHeight: '15.6px',
            textAlign: 'left',
            textUnderlinePosition: 'from-font',
            textDecorationSkipInk: 'none',
        },
        contentContainer: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
    };

    const renderIcon = () => {
        switch (iconType) {
            case 'mute':
                return (
                    <StyledMuteButton
                        onChange={onChange}
                        defaultChecked={defaultChecked}
                        disabled={disabled}
                    />
                );
            case 'checkbox':
            default:
                return (
                    <PreferenceCheckbox
                        onChange={onChange}
                        defaultChecked={defaultChecked}
                        disabled={disabled}
                    />
                );
        }
    };

    return (
        <Box sx={styles.contentContainer}>
            {renderIcon()}
            <Typography sx={{ ...styles.settingStyle, mb: '0px' }}>{option}</Typography>
            <Typography sx={styles.typeographyStyle}>
                {optionDescription}
            </Typography>
        </Box>
    );
}

export default PreferenceOptionWithIcon;