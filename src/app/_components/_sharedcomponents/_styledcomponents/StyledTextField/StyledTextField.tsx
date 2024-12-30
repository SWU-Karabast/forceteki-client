import React from 'react';
import { TextField } from '@mui/material';
import { IStyledTextFieldProps } from '@/app/_components/Auth/AuthTypes';

const StyledTextField: React.FC<IStyledTextFieldProps> = ({
    errorMessage,
    ...props
}) => {
    return (
        <TextField
            variant="outlined"
            fullWidth
            error={!!errorMessage}
            helperText={errorMessage || ''}
            {...props}
        />
    );
};

export default StyledTextField;
