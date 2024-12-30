// src/ThemeContextProvider.tsx
'use client';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '../_theme/theme';

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};
