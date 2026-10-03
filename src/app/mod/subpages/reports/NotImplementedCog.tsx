import React from 'react';
import { Box, Tooltip } from '@mui/material';

/**
 * The cog shown on cards that are not implemented yet, reused to mark mod tool controls
 * for features that do not exist yet.
 */
const NotImplementedCog: React.FC<{ size?: string }> = ({ size = '1rem' }) => (
    <Tooltip title="Not implemented yet">
        <Box
            component="span"
            aria-label="Not implemented yet"
            sx={{
                display: 'inline-block',
                width: size,
                height: size,
                flexShrink: 0,
                backgroundImage: 'url(/not-implemented.svg)',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                verticalAlign: 'middle',
            }}
        />
    </Tooltip>
);

export default NotImplementedCog;
