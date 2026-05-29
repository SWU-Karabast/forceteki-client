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
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0 /* Hidden by default */
    },
    heroismImg: {
        '@keyframes zoomFadeFirst': {
            '0%': {
                opacity: 1,
                transform: 'scale(0.85)',
            },
            '45%': {
                opacity: 1,
            },
            '50%': {
                opacity: 0,
                transform: 'scale(1.1)',
            },
            '95%': {
                opacity: 0,
            },
            '100%': {
                opacity: 1,
                transform: 'scale(0.85)',
            },
        },
        backgroundImage: 'url("/aspect-icons/aspect-heroism.webp")',
        animation: 'zoomFadeFirst 1.5s infinite ease-in-out',
    },
    villainyImg: {
        '@keyframes zoomFadeSecond': {
            '0%': {
                opacity: 0,
                transform: 'scale(0.85)',
            },
            '45%': {
                opacity: 0,
            },
            '50%': {
                opacity: 1,
                transform: 'scale(0.85)',
            },
            '95%': {
                opacity: 1,
            },
            '100%': {
                opacity: 0,
                transform: 'scale(1.1)',
            },
        },
        backgroundImage: 'url("/aspect-icons/aspect-villainy.webp")',
        animation: 'zoomFadeSecond 1.5s infinite ease-in-out',
    },

}

export default function MatchLoader({ sx = {} }: { sx?: SxProps<Theme> }) {
    return <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]}>
        <Box sx={[styles.image, styles.heroismImg]}></Box>
        <Box sx={[styles.image, styles.villainyImg]}></Box>
    </Box>
}
