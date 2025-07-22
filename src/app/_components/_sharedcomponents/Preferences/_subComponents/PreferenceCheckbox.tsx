import React from 'react';
import { Checkbox, Box } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';

function PreferenceCheckbox() {
    return (
        <Checkbox
            sx={{ pl:'0px' }}
            // Unchecked icon
            icon={
                <Box
                    sx={{
                        p:'0px',
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: 1,         // square with slight rounding
                        backgroundColor: '#ccc', // gray background
                    }}
                />
            }
            // Checked icon
            checkedIcon={
                <Box
                    sx={{
                        p:'0px',
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: 1,
                        backgroundColor: '#ccc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <CheckIcon sx={{ fontSize: 18, color: '#000' }} />
                </Box>
            }
        />
    );
}
export default PreferenceCheckbox;