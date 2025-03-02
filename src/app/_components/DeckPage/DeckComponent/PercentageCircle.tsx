import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

interface PercentageCircleProps {
    percentage: number;         // 0-100
    size?: number;              // total outer diameter in px
    strokeWidth?: number;       // thickness of the ring
    fillColor?: string;         // color for the filled portion
    trackColor?: string;        // color for the unfilled portion
    textColor?: string;         // color for the center text
    animationDuration?: number
}


const PercentageCircle: React.FC<PercentageCircleProps> = ({
    percentage,
    size = 80,
    strokeWidth = 10,
    fillColor = '#3f51b5',
    trackColor = '#e0e0e0',
    textColor = '#000',
    animationDuration = 1500
}) => {
    // Calculate how many degrees of the circle should be “filled”
    const fillAngle = Math.round((percentage / 100) * 360);
    const [currentPercentage, setCurrentPercentage] = useState(0);
    const [currentAngle, setCurrentAngle] = useState(0);

    useEffect(() => {
        // Reset to 0 when percentage changes
        setCurrentPercentage(0);
        setCurrentAngle(0);

        // Calculate how many frames we need based on duration and target value
        const totalFrames = Math.min(percentage, 100); // Cap at 100 for smoother animation
        const frameTime = animationDuration / totalFrames;
        const angleIncrement = (percentage / 100) * 360 / totalFrames;
        const percentageIncrement = percentage / totalFrames;

        let frame = 0;
        const timer = setInterval(() => {
            frame++;

            if (frame <= totalFrames) {
                setCurrentAngle(prev => Math.min(prev + angleIncrement, (percentage / 100) * 360));
                setCurrentPercentage(prev => {
                    const next = prev + percentageIncrement;
                    // Round to one decimal place
                    return Math.round(next * 10) / 10;
                });
            } else {
                // Ensure we end at exact values
                setCurrentAngle((percentage / 100) * 360);
                setCurrentPercentage(percentage);
                clearInterval(timer);
            }
        }, frameTime);

        return () => clearInterval(timer);
    }, [percentage, animationDuration]);

    // ----------------------Styles-----------------------------//
    const styles = {
        outerStyle: {
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            position: 'relative' as const,
            background: `conic-gradient(${fillColor} 0deg ${currentAngle}deg, ${trackColor} ${currentAngle}deg 360deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '9',
            transition: 'background 0.1s linear'
        },
        // Inner circle to "cut out" the center
        innerStyle: {
            width: `${size - strokeWidth * 2}px`,
            height: `${size - strokeWidth * 2}px`,
            borderRadius: '50%',
            position: 'absolute' as const,
            zIndex: '10',
            backgroundColor: 'rgba(0, 0, 0, 1)',
        },
        textStyle: {
            position: 'absolute' as const,
            color: textColor,
            fontWeight: 'bold',
            fontSize: '0.9rem',
            zIndex: '11',
            lineHeight: '13px',
            maxWidth: '35px',
            wordWrap: 'break-word',
            whiteSpace: 'normal',
            textAlign: 'center',
        },
    }
    return (
        <Box sx={styles.outerStyle}>
            <Box sx={styles.innerStyle} />
            <Typography sx={styles.textStyle}>
                {currentPercentage.toFixed(0)}%
            </Typography>
        </Box>
    );
};

export default PercentageCircle;