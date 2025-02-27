import React from 'react';
import { Box, Typography } from '@mui/material';

interface PercentageCircleProps {
    percentage: number;         // 0-100
    size?: number;              // total outer diameter in px
    strokeWidth?: number;       // thickness of the ring
    fillColor?: string;         // color for the filled portion
    trackColor?: string;        // color for the unfilled portion
    textColor?: string;         // color for the center text
}


const PercentageCircle: React.FC<PercentageCircleProps> = ({
    percentage,
    size = 80,
    strokeWidth = 10,
    fillColor = '#3f51b5',
    trackColor = '#e0e0e0',
    textColor = '#000'
}) => {
    // Calculate how many degrees of the circle should be “filled”
    const fillAngle = Math.round((percentage / 100) * 360);

    // Outer circle with conic-gradient
    const outerStyle = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        position: 'relative' as const,
        background: `conic-gradient(${fillColor} 0deg ${fillAngle}deg, ${trackColor} ${fillAngle}deg 360deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex:'9',
    };

    // Inner circle to "cut out" the center
    const innerStyle = {
        width: `${size - strokeWidth * 2}px`,
        height: `${size - strokeWidth * 2}px`,
        borderRadius: '50%',
        position: 'absolute' as const,
        zIndex:'10',
        backgroundColor: 'rgba(0, 0, 0, 1)',
    };

    const textStyle = {
        position: 'absolute' as const,
        color: textColor,
        fontWeight: 'bold',
        fontSize: '0.9rem',
        zIndex:'11',
        lineHeight: '13px',
        maxWidth:'35px',
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        textAlign: 'center',
    };

    return (
        <Box sx={outerStyle}>
            <Box sx={innerStyle} />
            <Typography sx={textStyle}>
                {percentage}%
            </Typography>
        </Box>
    );
};

export default PercentageCircle;