import React, { useState } from 'react';
import { Box, Typography, Slider } from '@mui/material';
import { styled } from '@mui/material/styles';

// Custom styled slider with Star Wars theme
const StarWarsSlider = styled(Slider)(({ theme }) => ({
    color: '#00D4FF', // Bright blue like lightsaber
    height: 8,
    padding: '13px 0',
    '& .MuiSlider-track': {
        border: 'none',
        background: 'linear-gradient(90deg, #00D4FF 0%, #0099CC 100%)',
        boxShadow: '0 0 8px rgba(0, 212, 255, 0.5)',
    },
    '& .MuiSlider-rail': {
        color: '#2A2A2A',
        opacity: 1,
        height: 8,
        borderRadius: 4,
        background: '#1A1A1A',
        border: '1px solid #444',
    },
    '& .MuiSlider-thumb': {
        height: 20,
        width: 20,
        backgroundColor: '#00D4FF',
        border: '2px solid #0099CC',
        boxShadow: '0 0 12px rgba(0, 212, 255, 0.8)',
        '&:before': {
            display: 'none',
        },
    },

}));

interface VolumeSliderProps {
    label: string;
    description: string;
    defaultValue?: number;
    onChange?: (value: number) => void;
    disabled?: boolean;
}

function VolumeSlider({ label, description, defaultValue = 50, onChange, disabled = false }: VolumeSliderProps) {
    const [volume, setVolume] = useState(defaultValue);

    const handleVolumeChange = (event: Event, newValue: number | number[]) => {
        const value = Array.isArray(newValue) ? newValue[0] : newValue;
        setVolume(value);
        onChange?.(value);
    };

    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            mb: '1rem',
        },
        labelContainer: {
            display: 'flex',
            flexDirection: 'column',
            width: '13.8rem',
            mr:'2rem'
        },
        settingStyle: {
            fontSize: '1.2rem',
            fontWeight: '600',
            lineHeight: '16.8px',
            textAlign: 'left',
            textUnderlinePosition: 'from-font',
            textDecorationSkipInk: 'none',
            mb: '10px',
        },
        descriptionStyle: {
            color: '#878787',
            fontSize: '0.9rem',
            fontWeight: '500',
            lineHeight: '14px',
            textAlign: 'left',
            textUnderlinePosition: 'from-font',
            textDecorationSkipInk: 'none',
        },
        sliderContainer: {
            flex: 1,
            maxWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        volumeDisplay: {
            minWidth: '40px',
            color: '#00D4FF',
            fontSize: '1rem',
            fontWeight: '600',
            textAlign: 'center',
        },
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.labelContainer}>
                <Typography sx={styles.settingStyle}>{label}</Typography>
                <Typography sx={styles.descriptionStyle}>{description}</Typography>
            </Box>
            <Box sx={styles.sliderContainer}>
                <StarWarsSlider
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={disabled}
                    min={0}
                    max={100}
                    step={1}
                />
                <Typography sx={styles.volumeDisplay}>{volume}%</Typography>
            </Box>
        </Box>
    );
}

export default VolumeSlider;