import * as React from 'react';
import { Button } from '@mui/material';
import { SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';

export type IChatButtonType = {
    variant: 'concede' | 'standard',
    text?: string | React.ReactNode,
    buttonFnc?: () => void,
    disabled?: boolean,
    sx?: SxProps<Theme>,
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    startIcon?: React.ReactNode;
}

function ChatButtonComponent(buttonType: IChatButtonType) {
    const hasBackgroundColor = buttonType.sx &&
        typeof buttonType.sx === 'object' &&
        'backgroundColor' in buttonType.sx;
    const hasHoverStyle = buttonType.sx &&
        typeof buttonType.sx === 'object' &&
        '&:hover' in buttonType.sx;

    return (
        <Button
            variant="contained"
            sx={{
                ...(hasBackgroundColor ? {} : { 
                    background: buttonType.disabled ? '#404040' : 
                        buttonType.text === 'Undo' ? 
                            'linear-gradient(rgb(29, 29, 29), #0a3d1e) padding-box, linear-gradient(to top, #1cb34a, #0a3d1e) border-box' :
                            buttonType.variant === 'concede' ? 
                                'linear-gradient(#380707, #380707) padding-box, linear-gradient(#7C0707, #C40000) border-box' : 
                                'linear-gradient(#1E2D32, #1E2D32) padding-box, linear-gradient(#404040, #008FC4) border-box',
                }),
                color: '#FFF',
                fontSize: buttonType.text === 'Undo' ? '20px' : '16px',
                border: '1px solid transparent',
                borderRadius: '10px',
                pt:'10px',
                pb:'10px',
                justifyContent: 'flex-end',
                paddingRight: buttonType.text === 'Undo' ? '35px' : '25px', // Add some padding from the right edge
                position: 'relative',
                '& .MuiButton-startIcon': {
                    position: 'absolute',
                    left: '12px',
                    marginRight: 0,
                    marginLeft: 0,
                    transform: 'skewX(5deg)', // Counter-skew to make icon straight
                    '& svg': {
                        width: '23px',
                        height: '23px',
                    },
                },
                '&:hover': {
                    ...(hasHoverStyle ? {} : { 
                        background: buttonType.text === 'Undo' ? 
                            'linear-gradient(rgb(29, 29, 29),rgb(20, 81, 40)) padding-box, linear-gradient(to top, #2ad44c, #0a3d1e) border-box' :
                            buttonType.variant === 'concede' ? 
                                'linear-gradient(#7C0707, #C40000) padding-box, linear-gradient(#7C0707, #C40000) border-box' : 
                                'linear-gradient(#2C4046, #2C4046) padding-box, linear-gradient(#404040, #008FC4) border-box',
                        boxShadow: buttonType.text === 'Undo' ? '0 0 8px rgba(0, 170, 70, 0.7)' : 'none',
                        border: buttonType.text === 'Undo' ? '1px solid rgba(0, 200, 90, 0.7)' : 'transparent',
                    }),
                },
                '&:disabled': {
                    backgroundColor: '#404040',
                    color:'#FFF'
                },
                transform: 'skewX(-5deg)',
                ...(buttonType.sx || {})
            }}
            disabled={buttonType.disabled ? buttonType.disabled : !buttonType.buttonFnc}
            onClick={buttonType.buttonFnc}
            onMouseEnter={buttonType.onMouseEnter}
            onMouseLeave={buttonType.onMouseLeave}
            startIcon={buttonType.startIcon}
        >
            {buttonType.text ? buttonType.text : <ArrowBackIosNewIcon fontSize="small" />}
        </Button>
    );
}
export default ChatButtonComponent;