import React from 'react';
import { s3TokenImageURL } from '@/app/_utils/s3Utils';
import { Box } from '@mui/material';

type StatusIconType = 'hidden' | 'sentinel' | 'blank' | 'lock' | 'stolen';

const IMAGES: Record<StatusIconType, string> = {
    hidden: '/HiddenIcon.png',
    sentinel: s3TokenImageURL('sentinel-icon'),
    blank: '/BlankIcon.png',
    lock: '/LockIcon.png',
    stolen: '/StolenIcon.png'
};

const styles = {
    width: '100%',
    aspectRatio: '1 / 1',
    flexShrink: 0,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    pointerEvents: 'auto',
    // One shadow for the whole stack, as the token badges carry one for every badge.
    filter: 'drop-shadow(0 4px 4px rgba(0, 0, 0, 0.5))',
};

export default function StatusIcon({ type }: { type: StatusIconType }) {
    return <Box sx={{ ...styles, backgroundImage: `url(${IMAGES[type]})` }}/>;
}