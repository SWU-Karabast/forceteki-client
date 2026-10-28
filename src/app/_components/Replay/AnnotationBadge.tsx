'use client';
import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { nagInfo, NAG_TONE_COLOR, type NagInfo } from '@/app/_utils/nagGlyphs';
import type { IAnnotationBadgeProps } from './ReplayTypes';

/** Small colored chip rendering a NAG glyph (e.g. "!!"). Renders nothing for unknown nags. */
const AnnotationBadge: React.FC<IAnnotationBadgeProps> = ({ nag, size = 18 }) => {
    const info = nagInfo(nag);
    if (!info) return null;
    return (
        <Tooltip title={info.label}>
            <Box
                component="span"
                sx={styles.badge(size, info.tone)}
            >
                {info.glyph}
            </Box>
        </Tooltip>
    );
};

export default AnnotationBadge;

// ----------------Styles----------------//
const styles = {
    badge: (size: number, tone: NagInfo['tone']) => ({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: size,
        height: size,
        px: 0.5,
        borderRadius: '4px',
        fontSize: { xs: 'max(11px, 0.7rem)', md: '0.7rem' },
        fontWeight: 800,
        lineHeight: 1,
        color: '#10131a',
        backgroundColor: NAG_TONE_COLOR[tone],
    }),
};
