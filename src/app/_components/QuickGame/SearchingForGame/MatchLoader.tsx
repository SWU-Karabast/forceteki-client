import { Box, SxProps, Theme } from '@mui/material';
import { SystemStyleObject } from '@mui/system';

const styles = {
    container: {
        position: 'relative',
        width: '200px',
        height: '200px',
        overflow: 'hidden',
        backgroundColor: '#0b071a',
        borderRadius: '12px',
    },
    image: {
        '@keyframes imageCycle': {
            '0%': {
                opacity: 0,
                transform: 'scale(0.05)',
            },
            '8%': {
                opacity: 1,
                transform: 'scale(0.55)',
            },
            '18%': {
                opacity: 1,
                transform: 'scale(1.15)',
            },
            '28%': {
                opacity: 1,
                transform: 'scale(0.96)',
            },
            '38%': {
                opacity: 1,
                transform: 'scale(1.02)',
            },
            '44%': {
                opacity: 1,
                transform: 'scale(1)',
            },
            '49%': {
                opacity: 0,
                transform: 'scale(0.96)',
            },
            '100%': {
                opacity: 0,
                transform: 'scale(0.96)',
            },
        },
        position: 'absolute',
        inset: 0,
        opacity: 0,
        transform: 'scale(0.05)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        animationTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform, opacity',
        animation: 'imageCycle 2.4s infinite',
    },
    heroismImg: {
        backgroundImage: 'url("/aspect-icons/aspect-heroism.webp")',
        // animation: 'zoomFadeFirst 1.5s infinite ease-in-out',
    },
    villainyImg: {
        backgroundImage: 'url("/aspect-icons/aspect-villainy.webp")',
        animationDelay: '1.2s',
        // animation: 'zoomFadeSecond 1.5s infinite ease-in-out',
    },

}

export default function MatchLoader({ sx = {} }: { sx?: SxProps<Theme> }) {
    return <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
        <Box sx={[styles.image, styles.heroismImg]}></Box>
        <Box sx={[styles.image, styles.villainyImg]}></Box>
    </Box>
}
