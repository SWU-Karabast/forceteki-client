import { Box, SxProps, Theme, Typography } from '@mui/material';

interface IOrDividerProps {
    label?: string;
    sx?: SxProps<Theme>;
}

const styles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem',
    },
    line: {
        flexGrow: 1,
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.28)',
        
    },
    label: {
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: '0.72rem',
        fontWeight: 600,
        lineHeight: 1,
        pt: '0.18em',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        transform: 'translateY(0.35rem)',
        userSelect: 'none'
    },
};

export default function OrDivider({ label = 'Or', sx }: IOrDividerProps) {
    return (
        <Box sx={[styles.root, ...(Array.isArray(sx) ? sx : [sx])]}>
            <Box sx={styles.line} />
            <Typography component="span" sx={styles.label}>{label}</Typography>
            <Box sx={styles.line} />
        </Box>
    );
}