import React, { useState, useEffect } from 'react';
import { Checkbox, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

interface PreferenceCheckboxProps {
    onChange?: (checked: boolean) => void;
    defaultChecked?: boolean;
    disabled?: boolean;
}

function PreferenceCheckbox({ onChange, defaultChecked = false, disabled = false }: PreferenceCheckboxProps) {
    const [isChecked, setIsChecked] = useState(defaultChecked);

    // Update internal state when defaultChecked changes
    useEffect(() => {
        setIsChecked(defaultChecked);
    }, [defaultChecked]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (disabled) return; // Don't allow change when disabled

        const newChecked = event.target.checked;
        setIsChecked(newChecked);
        onChange?.(newChecked);
    };

    return (
        <Checkbox
            sx={{ pl: '0px' }}
            checked={isChecked}
            onChange={handleChange}
            disabled={disabled}
            // Unchecked icon
            icon={
                <Box
                    sx={{
                        p: '0px',
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: 1,
                        backgroundColor: 'transparent',
                        border: '2px solid',
                        borderColor: disabled ? '#888' : '#00D4FF',
                        opacity: disabled ? 0.5 : 1,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                            boxShadow: disabled ? 'none' : '0 0 8px rgba(0, 212, 255, 0.3)',
                        },
                    }}
                />
            }
            checkedIcon={
                <Box
                    sx={{
                        p: '0px',
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: 1,
                        backgroundColor: disabled ? '#888' : '#00D4FF',
                        border: '2px solid',
                        borderColor: disabled ? '#888' : '#00D4FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: disabled ? 0.5 : 1,
                        transition: 'all 0.2s ease-in-out',
                        boxShadow: disabled ? 'none' : '0 0 8px rgba(0, 212, 255, 0.5)',
                    }}
                >
                    <CheckIcon sx={{
                        fontSize: 18,
                        color: disabled ? '#444' : '#000'
                    }} />
                </Box>
            }
        />
    );
}

export default PreferenceCheckbox;