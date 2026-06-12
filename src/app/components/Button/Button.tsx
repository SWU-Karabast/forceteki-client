import * as React from 'react';
import { Box, Button as MuiButton, SxProps, ButtonProps as MuiButtonProps } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import { useState } from 'react';
import useTimeout from '@/app/_utils/useTimeout';
import { deepmerge } from '@mui/utils';

type PulseButtonVariant = 'success' | 'info' | 'warning' | 'danger';

export type ButtonProps = Omit<MuiButtonProps, 'sx' | 'variant'> & {
    variant: PulseButtonVariant,
    text: string,
    cooldown?: boolean;
    pulse?: 'small' | 'big';
    sx?: SxProps<Theme>,
};

const INFO_FROM_COLOR = '#008CFF';
const INFO_TO_COLOR = '#00B4FF';

const WARNING_FROM_COLOR = '#CCAC00';
const WARNING_TO_COLOR = '#DCB900';

const SUCCESS_FROM_COLOR = '#00AA46';
const SUCCESS_TO_COLOR = '#00C85A';

const DANGER_FROM_COLOR = '#E6003C';
const DANGER_TO_COLOR = '#FF0046';

const variantColors: Record<PulseButtonVariant, Record<'from' | 'to', string>> = {
    info: {
        from: INFO_FROM_COLOR,
        to: INFO_TO_COLOR,
    },
    success: {
        from: SUCCESS_FROM_COLOR,
        to: SUCCESS_TO_COLOR,
    },
    danger: {
        from: DANGER_FROM_COLOR,
        to: DANGER_TO_COLOR,
    },
    warning: {
        from: WARNING_FROM_COLOR,
        to: WARNING_TO_COLOR,
    },
};

const styles = {
    button: {
        transform: 'skew(-10deg)',
        borderRadius: '1rem',
        height: { xs: '2.5rem', sm: '3rem', md: '3.8rem' },
        minWidth: { xs: '1.5rem', md: '2.5rem' },
        maxWidth: { xs: '5rem', sm: '7rem', md: '9rem' },
        flex: '1 1 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid transparent',
        background: `linear-gradient(#1d1d1d, #1d1d1d) padding-box, 
        linear-gradient(to top, #404040, #404040) border-box`,
        '&:hover': {
            background: `linear-gradient(#1d1d1d, #144151) padding-box, 
            linear-gradient(to top, #32515d, #404040) border-box`,
        },
        '&:not(:disabled)': {
            transition: 'box-shadow 0.3s ease-in-out',
        },
        // Improve touch target size for mobile
        touchAction: 'manipulation',
    },
    buttonText: {
        textTransform: 'none',
        transform: 'skew(10deg)',
        lineHeight: '1.2',
        fontSize: { xs: '0.6rem', sm: '0.9rem', md: '1.05rem' },
        textAlign: 'center',
        '& :disabled': {
            brightness: '0.7',
        },
    },
}

const bgStyles = {
    info: {
        background: `linear-gradient(#1d1d1d, #0a3b4d) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
        '&:hover': {
            background: `linear-gradient(#1d1d1d, #144151) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
        },
    },
    warning: {
        background: `linear-gradient(#1d1d1d, #3d3a0a) padding-box, 
                    linear-gradient(to top, #b3a81c, #3d3a0a) border-box`,
        '&:hover': {
            background: `linear-gradient(#1d1d1d,#514d14) padding-box, 
                    linear-gradient(to top, #d4c82a, #3d3a0a) border-box`,
        },
    },
    success: {
        background: `linear-gradient(#1d1d1d, #0a3d1e) padding-box, 
                    linear-gradient(to top, #1cb34a, #0a3d1e) border-box`,
        '&:hover': {
            background: `linear-gradient(#1d1d1d,#145128) padding-box, 
                    linear-gradient(to top, #2ad44c, #0a3d1e) border-box`,
        },
    },
    danger: {
        background: `linear-gradient(#1d1d1d, #641515) padding-box, 
                    linear-gradient(to top, #b82121, #641515) border-box`,
        '&:hover': {
            background: `linear-gradient(#1d1d1d, #6e1919) padding-box, 
                    linear-gradient(to top, #e02929, #641515) border-box`,
        },
    }
}

export default function Button(props: ButtonProps) {
    const {
        variant = 'info',
        text,
        sx = {},
        cooldown = false,
        pulse = 'small',
        disabled: disabledProp,
        ...muiSharedProps
    } = props;
    const [hasCooldown, setCooldown] = useState<boolean>(cooldown === true);
    const disabled = hasCooldown || disabledProp;
    const isBigPulse = pulse === 'big';
    const pulseAnimation = keyframes`
      0% {
        border-color: rgb(from ${variantColors[variant].from} r g b / 0.4);
        box-shadow: 0 0 ${isBigPulse ? 8 : 4}px rgb(from ${variantColors[variant].from} r g b / ${isBigPulse ? 0.6 : 0.4});
      }
      50% {
        border-color: rgb(from ${variantColors[variant].to} r g b / 0.6);
        box-shadow: 0 0 ${isBigPulse ? 16 : 8}px rgb(from ${variantColors[variant].to} r g b / ${isBigPulse ? 0.8 : 0.6});
      }
      100% {
        border-color: rgb(from ${variantColors[variant].from} r g b / 0.4);
        box-shadow: 0 0 ${isBigPulse ? 8 : 4}px rgb(from ${variantColors[variant].from} r g b / ${isBigPulse ? 0.6 : 0.4});
      }
    `;
    const variantStyles: SxProps<Theme> = disabled ? {} : deepmerge(bgStyles[variant], {
        animationName: `${pulseAnimation}`,
        animationTimingFunction: 'ease-in-out',
        animationIterationCount: 'infinite',
        animationDuration: `${isBigPulse ? 3 : 4}s`,
        boxShadow: `0 0 6px rgb(from ${variantColors[variant].from} r g b / 0.5)`,
        border: `1px solid rgb(from ${variantColors[variant].from} r g b / 0.5)`,
        '&:hover': {
            boxShadow: `0 0 8px rgb(from ${variantColors[variant].from} r g b / 0.7)`,
            border: `1px solid rgb(from ${variantColors[variant].to} r g b / 0.7)`,
        },
    });

    useTimeout(() => {
        setCooldown(false);
    }, cooldown === true ? 500 : null);

    return (
        <MuiButton
            variant="contained"
            sx={[styles.button, variantStyles, ...(Array.isArray(sx) ? sx : [sx])]}
            disabled={disabled}
            {...muiSharedProps}
        >
            <Box sx={styles.buttonText}>
                {text}
            </Box>
        </MuiButton>
    );
}
