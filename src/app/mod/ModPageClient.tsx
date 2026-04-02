'use client';
import React, { useState } from 'react';
import { Box, Typography, Tab, Tabs } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import CosmeticsManagerTab from './subpages/CosmeticsManagertab';
import UserManagementTab from './subpages/UserManagementTab';
import { useRouter } from 'next/navigation';

enum ModToolsTab {
    CosmeticsManager = 0,
    UserManagement = 1,
}

const ModPageClient = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<ModToolsTab>(ModToolsTab.CosmeticsManager);

    const handleBackClick = () => {
        router.push('/');
    };

    // ======================== STYLES ========================
    const styles = {
        pageContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            height: '100%',
            width: '100%',
            padding: '1rem',
            overflow: 'hidden',
            color: 'white',
        },
        headerRow: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            position: 'relative' as const,
            zIndex: 1000,
        },
        backButton: {
            position: 'absolute' as const,
            left: '10px',
            height: '100%',
            zIndex: 1001,
        },
        contentContainer: {
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
        },
        tabContainer: {
            width: '20%',
            minWidth: '180px',
            maxWidth: '240px',
            backgroundColor: 'transparent',
        },
        tab: {
            color: 'white',
            alignItems: 'start',
            textTransform: 'none' as const,
            fontSize: '1.1rem',
            height: '3.5rem',
            mb: '8px',
            '&.Mui-selected': {
                backgroundColor: 'rgba(47, 125, 182, 0.5)',
                borderRadius: '5px',
                color: 'white',
            },
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.3)',
                borderRadius: '5px',
                color: 'white',
            },
        },
        tabPanel: {
            flex: 1,
            paddingLeft: '2rem',
            overflowY: 'auto' as const,
            maxHeight: 'calc(90vh - 4rem)',
            '::-webkit-scrollbar': { width: '0.2vw' },
            '::-webkit-scrollbar-thumb': { backgroundColor: '#D3D3D3B3', borderRadius: '1vw' },
            '::-webkit-scrollbar-button': { display: 'none' },
        },
    };

    return (
        <Box sx={styles.pageContainer}>
            {/* Header with Back button */}
            <Box sx={styles.headerRow}>
                <Box sx={styles.backButton}>
                    <PreferenceButton
                        variant={'standard'}
                        text="Back"
                        buttonFnc={handleBackClick}
                    />
                </Box>
                <Typography variant={'h5'} color="white">
                    Mod Tools
                </Typography>
            </Box>

            {/* Vertical Tabs Layout */}
            <Box sx={styles.contentContainer}>
                <Tabs
                    orientation="vertical"
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    TabIndicatorProps={{ style: { display: 'none' } }}
                    sx={styles.tabContainer}
                >
                    <Tab label="Cosmetics Manager" sx={styles.tab} />
                    <Tab label="User Management" sx={styles.tab} />
                </Tabs>

                {/* Tab Content */}
                <Box sx={styles.tabPanel}>
                    {activeTab === ModToolsTab.CosmeticsManager && <CosmeticsManagerTab />}
                    {activeTab === ModToolsTab.UserManagement && <UserManagementTab />}
                </Box>
            </Box>
        </Box>
    );
};

export default ModPageClient;