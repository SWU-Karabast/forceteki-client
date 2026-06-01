'use client';
import { Box, Typography } from '@mui/material';
import PreferencesComponent from '@/app/_components/_sharedcomponents/Preferences/PreferencesComponent';
import React, { Suspense } from 'react';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '../_contexts/User.context';

const PreferencesInner: React.FC = () => {
    const router = useRouter();
    const { user } = useUser();
    const searchParams = useSearchParams();
    const initialTab = searchParams?.get('tab') ?? undefined;
    const handleExit = () => {
        router.push('/');
    }

    // ----------------------Styles-----------------------------//
    const styles = {
        lobbyTextStyle:{
            ml:'30px',
            fontSize: '3.0em',
            fontWeight: '600',
            color: 'white',
            alignSelf: 'flex-start',
            mb: '0px',
            cursor: 'pointer',
            zIndex: 2
        },
        mainContainer:{
            height: '100vh',
            overflow: 'hidden',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display:'grid',
        },
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.90rem',
        }
    };

    return (
        <Box sx={styles.mainContainer}>
            <Typography sx={styles.lobbyTextStyle} onClick={handleExit}>KARABAST</Typography>
            <PreferencesComponent
                sidebarOpen={false}
                isPreferenceOpen={true}
                tabs={user ? ['general','gameOptions', 'keyboardShortcuts','soundOptions','cosmetics'] : ['general','gameOptions','soundOptions']}
                variant={'homePage'}
                initialTab={initialTab}
            />
            <Typography variant="body1" sx={styles.disclaimer}>
                Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                Star Wars characters, cards, logos, and art are property of Disney
                and/or Fantasy Flight Games.
            </Typography>
        </Box>
    );
};

const Preferences: React.FC = () => (
    <Suspense fallback={null}>
        <PreferencesInner />
    </Suspense>
);

export default Preferences;
