import React, { useState, useEffect } from 'react';
import { useBreakpointName } from './useBreakpointName';
import { Box } from '@mui/material';
import { useScreenOrientation } from '@/app/_utils/useScreenOrientation';

// Debugging component to display the current breakpoint in lower right corner of screen
const BreakpointOverlay: React.FC = () => {
    const breakpoint = useBreakpointName();
    const { isPortrait } = useScreenOrientation();
    const [zoomLevel, setZoomLevel] = useState<number | null>(null);
    const [isFractionalZoom, setIsFractionalZoom] = useState<boolean>(false);
    
    // Function to detect actual browser zoom vs device emulation
    const updateZoomLevel = () => {
        if (typeof window !== 'undefined') {
            // Get actual screen width as reported by window.screen
            const actualWidth = window.screen.width;
            
            // Get the reported inner width of the window
            const innerWidth = window.innerWidth;
            
            // Calculate current DPR
            const currentDPR = window.devicePixelRatio;
            
            // Calculate zoom level
            const zoom = Math.round(currentDPR * 100);
            setZoomLevel(zoom);
            
            // For desktop browsers, a good indicator of user zoom is when the ratio between
            // window.innerWidth and the actual body width differs from devicePixelRatio
            // In device emulation, the ratio will match the emulated device's normal DPR
            const docWidth = document.documentElement.clientWidth;
            
            // Detect if this is likely an actual zoom event or device emulation
            // Device emulation typically has specific DPR values and screen dimensions
            // that match real devices exactly (1, 2, 3, etc) while zoom typically gives
            // non-integer values or unusual ratios
            
            // This heuristic works by assuming browser zoom usually creates fractional DPR
            // values, while emulation uses precise DPR values (typically whole numbers)
            const isLikelyRealZoom = 
                (currentDPR !== 1 && currentDPR !== 2 && currentDPR !== 3) || // Not a common DPR
                (Math.abs(currentDPR - Math.round(currentDPR)) > 0.01); // Not very close to an integer
                
            setIsFractionalZoom(isLikelyRealZoom && zoom !== 100);
        }
    };

    // Initialize and set up listener for zoom changes
    useEffect(() => {
        // Set initial zoom level
        updateZoomLevel();
        
        // Detect zoom changes
        window.addEventListener('resize', updateZoomLevel);
        
        // Clean up event listener
        return () => {
            window.removeEventListener('resize', updateZoomLevel);
        };
    }, []);

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                bgcolor: isFractionalZoom ? 'red' : 'black',
                color: isFractionalZoom ? 'white' : 'lime',
                px: 2,
                py: 1,
                zIndex: 9999,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                opacity: 0.75,
            }}
        >
            Orientation: {isPortrait ? 'Portrait' : 'Landscape'}
            <br />
            Breakpoint: {breakpoint ?? 'unknown'}
            {isFractionalZoom && <>
                <br />
                <span style={{ fontWeight: 'bold' }}>Fractional Zoom Detected: {zoomLevel}%</span>
            </>}
        </Box>
    );
};

export default BreakpointOverlay;
