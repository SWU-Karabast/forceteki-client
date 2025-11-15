import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SxProps, Theme } from '@mui/material/styles';


type DamageCounterProps = {
    value: number | string;
    // sx?: SxProps<Theme>;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    variant?: 'damage' |'distributeDamage' | 'distributeHealing';
};

const TOKEN_VARIANTS = {
    damage: {
        fillColor: '#DB131D',
        strokeColor: null,
        strokeWidth: 0,
        fontSize: '1.9rem',
    },
    distributeDamage: {
        fillColor: '#6d1414ff',
        strokeColor: '#DB131D',
        strokeWidth: 6,
        fontSize: '1.4rem',
    },
    distributeHealing: {
        fillColor: '#1a6681ff',
        strokeColor: '#00BAFF',
        strokeWidth: 6,
        fontSize: '1.4rem',
    },
}

const baseStyles: SxProps<Theme> = {
    fontWeight: 700,
    color: 'white',
    display: 'inline-flex',
    py: '.3rem',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    filter: 'drop-shadow(1px 2px 1px rgba(0,0,0,0.40))',
    textShadow: '2px 2px rgba(0,0,0,0.20)',
    lineHeight: 1,
    userSelect: 'none',
};

export function DamageCounterToken({ value, fillColor, strokeColor, strokeWidth = 0, variant = 'damage' }: DamageCounterProps) {
    const paddingX = value.toString().length > 1 ? '.5rem' : '.7rem';
    const fontSize = TOKEN_VARIANTS[variant].fontSize || '1.9rem';
    return (
        <Box sx={{ ...baseStyles, px: paddingX, fontSize: fontSize }}>
            <Box
                component="svg"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                aria-hidden
                preserveAspectRatio="none" 
                sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                }}
            >
                <path
                    d="M16 0 H76 A24 24 0 0 1 100 24 V84 L84 100 H24 A24 24 0 0 1 0 76 V16 L16 0 Z"
                    fill={TOKEN_VARIANTS[variant].fillColor || fillColor || '#DB131D'}
                    stroke={TOKEN_VARIANTS[variant].strokeColor || strokeColor}
                    strokeWidth={TOKEN_VARIANTS[variant].strokeWidth || strokeWidth}
                />
            </Box>
            <Typography
                variant="body1"
                sx={{
                    position: 'relative',
                    m: 0,
                    fontWeight: 700,
                    fontSize: 'inherit',
                    color: 'inherit',
                    lineHeight: 1,
                    pointerEvents: 'none',
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}