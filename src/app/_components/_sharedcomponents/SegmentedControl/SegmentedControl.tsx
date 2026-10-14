import { useEffect } from 'react';
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import type { ISegmentedControlProps } from './SegmentedControl.types';

const styles = {
    container: {
        position: 'relative',
        width: '100%',
        padding: '3px',
        boxSizing: 'border-box',
        borderRadius: '5px',
        backgroundColor: '#1B2B38',
    },
    indicator: {
        position: 'absolute',
        top: '3px',
        bottom: '3px',
        left: '3px',
        borderRadius: '3px',
        backgroundColor: '#557894',
        pointerEvents: 'none',
        transition: 'transform 200ms ease',
        '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
        },
    },
    group: {
        position: 'relative',
        display: 'grid',
    },
    option: {
        position: 'relative',
        margin: 0,
        minWidth: 0,
        minHeight: '40px',
        padding: '0.5rem 0.25rem',
        borderRadius: '3px',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'white',
        '&:not(.Mui-disabled):not(:has(input:checked)):hover': {
            backgroundColor: '#30485C',
        },
        '&:has(input:focus-visible)': {
            outline: '2px solid #C0D5E5',
            outlineOffset: '-2px',
        },
        '&.Mui-disabled': {
            cursor: 'not-allowed',
        },
        '& .MuiFormControlLabel-label': {
            width: '100%',
        },
        '& .MuiFormControlLabel-label.Mui-disabled': {
            color: 'rgba(255, 255, 255, 0.3)',
        },
    },
    radio: {
        position: 'absolute',
        inset: 0,
        padding: 0,
        opacity: 0,
        '& .MuiSvgIcon-root': {
            display: 'none',
        },
    },
    label: {
        position: 'relative',
        display: 'block',
        fontSize: '1rem',
        lineHeight: 1.3,
        overflowWrap: 'anywhere',
    },
    description: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        display: 'block',
        color: 'rgba(170, 170, 170, 0.85)',
        '.Mui-disabled &': {
            color: 'inherit',
        },
    },
};

export default function SegmentedControl<TValue extends string>({
    name,
    label,
    value,
    options,
    onChange,
    disabled = false,
}: ISegmentedControlProps<TValue>) {
    const selectedIndex = options.findIndex((option) => option.value === value);
    const hasDescriptions = options.some((option) => Boolean(option.description));
    useEffect(() => {
        if (selectedIndex < 0) {
            console.warn(`SegmentedControl '${name}' has no option for '${value}'`);
        }
    }, [name, value, selectedIndex]);

    return (
        <Box sx={styles.container}>
            {selectedIndex >= 0 && (
                <Box
                    aria-hidden="true"
                    sx={{
                        ...styles.indicator,
                        width: `calc((100% - 6px) / ${options.length})`,
                        transform: `translateX(${selectedIndex * 100}%)`,
                    }}
                />
            )}
            <RadioGroup
                name={name}
                aria-label={label}
                value={value}
                sx={{ ...styles.group, gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
            >
                {options.map((option) => (
                    <FormControlLabel
                        key={option.value}
                        value={option.value}
                        disabled={disabled || option.disabled}
                        sx={{ ...styles.option, py: hasDescriptions ? '1.25rem' : '0.5rem' }}
                        control={
                            <Radio
                                disableRipple
                                sx={styles.radio}
                                onChange={() => onChange(option.value)}
                            />
                        }
                        label={
                            <Box component="span" sx={styles.label}>
                                {option.label}
                                {option.description && (
                                    <Typography component="span" variant="body2" sx={styles.description}>
                                        {option.description}
                                    </Typography>
                                )}
                            </Box>
                        }
                    />
                ))}
            </RadioGroup>
        </Box>
    );
}
