import React from 'react';
import { useBreakpointName } from './useBreakpointName';
import { Box } from '@mui/material';
import { useScreenOrientation } from '@/app/_utils/useScreenOrientation';

// Debugging component to display the current breakpoint in lower right corner of screen
const BreakpointOverlay: React.FC = () => {
    const breakpoint = useBreakpointName();
    const { isPortrait } = useScreenOrientation();

    return (
        <Box
            sx={{
                position: 'fixed',
                bottom: 0,
                right: 0,
                bgcolor: 'black',
                color: 'lime',
                px: 2,
                py: 1,
                zIndex: 9999,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                opacity: 0.75,
            }}
        >
            Orientation:{isPortrait ? 'Portrait' : 'Landscape'}
            <br />
            Breakpoint: {breakpoint ?? 'unknown'}
        </Box>
    );
};

export default BreakpointOverlay;
