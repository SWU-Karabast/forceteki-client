'use client';

import React from 'react';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import { useRouter } from 'next/navigation';

const Login: React.FC = () => {
    const isDev = process.env.NODE_ENV === 'development';
    const { login, devLogin } = useUser();
    const router = useRouter();
    // ------------------------STYLES------------------------//
    const loginStyles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: '12em',
        },
        primaryCard: {
            width: { xs: '90vw', sm: '70vw', md: '60vw', lg: '30vw' },
            p: '2.5em',
            borderRadius: '1.5em',
            backgroundColor: '#000000E6',
            backdropFilter: 'blur(20px)',
            mb: '2em',
        },
        heading: {
            fontFamily: 'var(--font-barlow), sans-serif',
            fontWeight: '800',
            fontSize: '2em',
            color: '#fff',
            mb: '.5em',
        },
        button: {
            width: '100%',
            height: '3em',
            borderRadius: '0.5em',
            fontFamily: 'var(--font-barlow), sans-serif',
            fontSize: '1.2em',
            mb: '1em',
        },
    };

    return (
        <Box sx={loginStyles.container}>
            <Card sx={loginStyles.primaryCard}>
                <CardContent>
                    <Typography variant="h3" sx={loginStyles.heading}>
                        Login
                    </Typography>
                    {/* Log in with Google */}
                    <Button
                        variant="contained"
                        sx={{ ...loginStyles.button, backgroundColor: '#db4437' }}
                        onClick={() => login('google')}
                    >
                        Log in with Google
                    </Button>
                    {/* Log in with Discord */}
                    <Button
                        variant="contained"
                        sx={{ ...loginStyles.button, backgroundColor: '#7289da' }}
                        onClick={() => login('discord')}
                    >
                        Log in with Discord
                    </Button>
                    <Button
                        variant="contained"
                        sx={{ ...loginStyles.button }}
                        onClick={() => router.push('/')}
                    >
                        Back
                    </Button>
                    { isDev && 
						<>
						    <Button
						        variant="contained"
						        sx={{ ...loginStyles.button, backgroundColor: 'Grey' }}
						        onClick={() => devLogin('Order66')}
						    >
    Login as Order66
						    </Button>
						    <Button
						        variant="contained"
						        sx={{ ...loginStyles.button, backgroundColor: 'Grey' }}
						        onClick={() => devLogin('ThisIsTheWay')}
						    >
    Login as ThisIsTheWay
						    </Button>
						</>
                    }
                </CardContent>
            </Card>
        </Box>
    );
};

export default Login;
