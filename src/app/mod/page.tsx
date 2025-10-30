import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/_utils/auth';
import { Box, Alert } from '@mui/material';
import Link from 'next/link';
import ModPageClient from './ModPageClient';
import { ServerApiService } from '../_services/ServerApiService';

async function checkModAccess(): Promise<boolean> {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return false;
    }

    try {
        const res = await ServerApiService.userIsModAsync(`next-auth.session-token=${session.jwtToken}`);
        return res;
    } catch (error) {
        console.error('Error checking mod access:', error);
        return false;
    }
}

export default async function ModPage() {
    const session = await getServerSession(authOptions);

    // Check if user is logged in
    if (!session?.user) {
        return (
            <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    You must be logged in to access mod tools.
                </Alert>
                <Link href="/" style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none'
                }}>
                    Back to Home
                </Link>
            </Box>
        );
    }

    // Check if user has mod access
    const isMod = await checkModAccess();

    if (!isMod) {
        return (
            <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <Alert severity="error" sx={{ mb: 2 }}>
                    Access denied. You do not have permission to access mod tools.
                </Alert>
                <Link href="/" style={{
                    marginTop: '1rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#1976d2',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none'
                }}>
                    Back to Home
                </Link>
            </Box>
        );
    }

    // User is authenticated and has mod access, render the client component
    return <ModPageClient />;
}
