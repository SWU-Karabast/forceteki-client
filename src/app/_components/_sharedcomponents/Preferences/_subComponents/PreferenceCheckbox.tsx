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
                        borderRadius: 1,         // square with slight rounding
                        backgroundColor: disabled ? '#999' : '#ccc', // darker gray when disabled
                        opacity: disabled ? 0.5 : 1,
                    }}
                />
            }
            // Checked icon
            checkedIcon={
                <Box
                    sx={{
                        p: '0px',
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: 1,
                        backgroundColor: disabled ? '#999' : '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    <CheckIcon sx={{
                        fontSize: 18,
                        color: disabled ? '#666' : '#000'
                    }} />
                </Box>
            }
        />
    );
}

export default PreferenceCheckbox;