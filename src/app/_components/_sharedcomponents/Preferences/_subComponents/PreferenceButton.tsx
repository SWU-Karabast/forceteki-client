import * as React from 'react';
import { Button } from '@mui/material';
import { IButtonType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';


function PreferenceButton(buttonType: IButtonType) {
    const hasBackgroundColor = buttonType.sx &&
        typeof buttonType.sx === 'object' &&
        'backgroundColor' in buttonType.sx;
    const hasHoverStyle = buttonType.sx &&
        typeof buttonType.sx === 'object' &&
        '&:hover' in buttonType.sx;
    const styles = {
        buttonStyle:{
            ...(hasBackgroundColor ? {} : { background: buttonType.disabled ? '#404040' : buttonType.variant === 'concede' ? 'linear-gradient(#380707, #380707) padding-box,' +
                'linear-gradient(#7C0707, #C40000) border-box' : buttonType.variant === 'standard' ? 'linear-gradient(#1E2D32, #1E2D32) padding-box,' +
                'linear-gradient(#404040, #008FC4) border-box' : 'linear-gradient(#a07f26, #a07f26) padding-box, linear-gradient(#404040, #7a611d) border-box'
            }),
            color: '#FFF',
            fontSize: '16px',
            border: '1px solid transparent',
            borderRadius: '10px',
            pt:'10px',
            pb:'10px',
            '&:hover': {
                ...(hasHoverStyle ? {} : { background: buttonType.variant === 'concede' ? 'linear-gradient(#7C0707, #C40000) padding-box, ' +
                    'linear-gradient(#7C0707, #C40000) border-box' : buttonType.variant === 'standard' ? 'linear-gradient(#2C4046, #2C4046) padding-box,' +
                    'linear-gradient(#404040, #008FC4) border-box' : 'linear-gradient(#8d6f20, #8d6f20) padding-box, linear-gradient(#404040, #7a611d) border-box' }),
                boxShadow: 'none',
            },
            '&:disabled': {
                backgroundColor: '#404040',
                color:'#FFF'
            },
            transform: 'skewX(-5deg)',
            ...(buttonType.sx || {})
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
            disabled={buttonType.disabled ? buttonType.disabled : !buttonType.buttonFnc}
            onClick={buttonType.buttonFnc}
            onMouseEnter={buttonType.onMouseEnter}
            onMouseLeave={buttonType.onMouseLeave}
        >
            {buttonType.text ? buttonType.text : <ArrowBackIosNewIcon fontSize="small" />}
        </Button>
    );
}
export default PreferenceButton;
