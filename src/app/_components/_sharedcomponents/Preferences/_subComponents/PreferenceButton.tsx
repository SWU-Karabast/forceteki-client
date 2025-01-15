import * as React from 'react';
import { Button } from '@mui/material';
import { IButtonType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';


function PreferenceButton(buttonType: IButtonType) {
    const styles = {
        buttonStyle:{
            background: buttonType.variant === 'concede' ? 'linear-gradient(#380707, #380707) padding-box,' +
                'linear-gradient(#7C0707, #C40000) border-box' : 'linear-gradient(#1E2D32, #1E2D32) padding-box,' +
                'linear-gradient(#404040, #008FC4) border-box',
            color: '#FFF',
            fontSize: '16px',
            border: '1px solid transparent',
            borderRadius: '10px',
            pt:'10px',
            pb:'10px',
            '&:hover': {
                background: buttonType.variant === 'concede' ? 'linear-gradient(#7C0707, #C40000) padding-box, ' +
                    'linear-gradient(#7C0707, #C40000) border-box' : 'linear-gradient(#2C4046, #2C4046) padding-box,' +
                    'linear-gradient(#404040, #008FC4) border-box',
                boxShadow: 'none',
            },
            transform: 'skewX(-5deg)',
        },
        buttonContainer:{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'row',
        }
    }

    return (
        <Button
            variant="contained"
            sx={styles.buttonStyle}
            disabled={!buttonType.buttonFnc}
            onClick={buttonType.buttonFnc}
        >
            {buttonType.text}
        </Button>
    );
}
export default PreferenceButton;
