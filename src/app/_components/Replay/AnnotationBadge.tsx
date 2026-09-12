'use client';
import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { nagInfo, NAG_TONE_COLOR } from '@/app/_utils/nagGlyphs';

/** Small colored chip rendering a NAG glyph (e.g. "!!"). Renders nothing for unknown nags. */
const AnnotationBadge: React.FC<{ nag?: string; size?: number }> = ({ nag, size = 18 }) => {
    const info = nagInfo(nag);
    if (!info) return null;
    return (
        <Tooltip title={info.label}>
            <Box
                component="span"
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: size,
                    height: size,
                    px: 0.5,
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: '#10131a',
                    backgroundColor: NAG_TONE_COLOR[info.tone],
                }}
            >
                {info.glyph}
            </Box>
        </Tooltip>
    );
};

export default AnnotationBadge;
