import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Alert, Divider } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import { useUser } from '@/app/_contexts/User.context';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';

function GameOptionsTab() {
    const { user, updateUserPreferences } = useUser();
    const [muteChatEnabled, setMuteChatEnabled] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

    useEffect(() => {
        setMuteChatEnabled(user?.preferences?.gameOptions?.muteChat ?? false);
    }, [user]);

    const handleMuteChatChange = async (value: boolean) => {
        setMuteChatEnabled(value);
        try {
            const result = await savePreferencesGeneric(
                user,
                { gameOptions: { muteChat: value } },
                updateUserPreferences
            );
            if (result.success) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(null), 3000);
            } else {
                setSaveStatus('error');
                setMuteChatEnabled(!value);
            }
        } catch (error) {
            console.error('Failed to save game option:', error);
            setSaveStatus('error');
            setMuteChatEnabled(!value);
        }
    };

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        statusContainer: {
            mt: '1rem',
        },
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>Chat</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Box sx={{ mb: '10px' }}>
                    <PreferenceOption
                        option={'Mute Chat'}
                        optionDescription={'Mute chat in all games.'}
                        iconType="checkbox"
                        onChange={handleMuteChatChange}
                        defaultChecked={muteChatEnabled}
                        disabled={!user}
                    />
                </Box>
                {!user && (
                    <Typography sx={{ ml: '1rem', color: '#888', fontSize: '0.85rem' }}>
                        Log in to save game options.
                    </Typography>
                )}
                {saveStatus === 'success' && (
                    <Alert severity="success" sx={{ ...styles.statusContainer, background: 'none', color: 'green' }}>
                        Preference saved successfully.
                    </Alert>
                )}
                {saveStatus === 'error' && (
                    <Alert severity="error" sx={{ ...styles.statusContainer, background: 'none', color: 'red' }}>
                        Failed to save preference.
                    </Alert>
                )}
            </Box>
        </>
    );
}

export default GameOptionsTab;