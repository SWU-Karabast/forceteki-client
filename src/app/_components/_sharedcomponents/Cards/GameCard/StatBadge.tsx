import React from 'react';
import { s3TokenImageURL } from '@/app/_utils/s3Utils';
import { Box, type SxProps, type Theme, Typography } from '@mui/material';

const styles = {
    numberFont: {
        fontSize: '1em',
        fontWeight: '700',
        textShadow: '0px 0px 3px black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        cursor: 'default',
        userSelect: 'none',
    },
    icon: {
        WebkitTouchCallout: 'none', /* Disables the long-press menu on iOS */
        WebkitUserSelect: 'none',   /* Prevents image selection */
        userSelect: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: '3 / 4',
        display: 'flex',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
    },
    powerIcon:{
        backgroundImage: `url(${s3TokenImageURL('power-badge')})`,
    },
    healthIcon:{
        backgroundImage: `url(${s3TokenImageURL('hp-badge')})`,
    },
}

type StatBadgeProps = {
    sx: SxProps<Theme>;
    value: number;
};

function StatBadge({ sx, value }: StatBadgeProps) {
    return (
        <Box sx={[styles.icon, ...(Array.isArray(sx) ? sx : [sx])]}>
            <Typography sx={styles.numberFont}>{value}</Typography>
        </Box>
    );
}

export function HealthBadge({ sx, value }: StatBadgeProps) {
    return <StatBadge sx={[styles.healthIcon, ...(Array.isArray(sx) ? sx : [sx])]} value={value} />;
}

export function PowerBadge({ sx, value }: StatBadgeProps) {
    return <StatBadge sx={[styles.powerIcon, ...(Array.isArray(sx) ? sx : [sx])]} value={value} />;
}