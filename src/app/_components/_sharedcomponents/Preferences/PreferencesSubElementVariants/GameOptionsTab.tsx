import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Alert, Divider } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useUser } from '@/app/_contexts/User.context';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';

enum SaveStatus {
    NoChange = 'noChange',
    Success = 'success',
    Error = 'error',
}

function GameOptionsTab({ setHasNewChanges }: { setHasNewChanges?: (has: boolean) => void }) {
    const { user, updateUserPreferences } = useUser();
    const [muteChatEnabled, setMuteChatEnabled] = useState<boolean>(false);
    const [originalMuteChat, setOriginalMuteChat] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NoChange);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const currentValue = user?.preferences?.gameOptions?.muteChat ?? false;
        setMuteChatEnabled(currentValue);
        setOriginalMuteChat(currentValue);
    }, [user]);

    useEffect(() => {
        const unsaved = muteChatEnabled !== originalMuteChat;
        setHasChanges(unsaved);
        if (setHasNewChanges) {
            setHasNewChanges(unsaved);
        }
    }, [muteChatEnabled, originalMuteChat]);

    const handleMuteChatChange = (value: boolean) => {
        setMuteChatEnabled(value);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(SaveStatus.NoChange);
        try {
            const result = await savePreferencesGeneric(
                user,
                { gameOptions: { muteChat: muteChatEnabled } },
                updateUserPreferences
            );
            if (result.success) {
                setOriginalMuteChat(muteChatEnabled);
                setSaveStatus(SaveStatus.Success);
                setSaveMessage('Game options saved successfully.');
                setTimeout(() => setSaveStatus(SaveStatus.NoChange), 3000);
                setHasChanges(false);
                if (setHasNewChanges) {
                    setHasNewChanges(false);
                }
            } else {
                setSaveStatus(SaveStatus.Error);
                setSaveMessage('Failed to save game options to server.');
            }
        } catch (error) {
            console.error('Failed to save game options:', error);
            if (error instanceof Error) {
                setSaveMessage(error.message);
            } else {
                setSaveMessage('Unknown Server Error');
            }
            setSaveStatus(SaveStatus.Error);
        } finally {
            setIsSaving(false);
        }
    };

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        saveButtonContainer: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            mt: '2rem',
        },
        saveButton: {
            minWidth: '140px',
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
            </Box>

            <Box sx={styles.saveButtonContainer}>
                <PreferenceButton
                    variant="standard"
                    buttonFnc={handleSave}
                    disabled={!hasChanges || isSaving}
                    text={'Save Changes'}
                    sx={styles.saveButton}
                />
                {saveStatus === SaveStatus.Success && (
                    <Alert severity="success" sx={{ flexGrow: 1, background: 'none', color: 'green' }}>
                        {saveMessage}
                    </Alert>
                )}
                {saveStatus === SaveStatus.Error && (
                    <Alert severity="error" sx={{ flexGrow: 1, background: 'none', color: 'red' }}>
                        {saveMessage}
                    </Alert>
                )}
            </Box>
        </>
    );
}

export default GameOptionsTab;