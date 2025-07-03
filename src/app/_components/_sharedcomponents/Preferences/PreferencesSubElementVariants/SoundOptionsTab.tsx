import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider, Button, Alert, CircularProgress } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import VolumeSlider from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VolumeSlider';
import { useUser } from '@/app/_contexts/User.context';
import {
    loadPreferencesFromLocalStorage,
    savePreferencesToLocalStorage,
    saveSoundPreferencesToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { Preferences } from '@/app/_contexts/UserTypes';

function SoundOptionsTab() {
    const { user, updateUserPreferences } = useUser(); // You'll need to add updateUserPreferences to your context
    const [soundPreferences, setSoundPreferences] = useState<Preferences['sound']>({
        muteAllSound: false,
        volume: 0.75,
        muteCardClickSound: false,
        muteMenuButtonsSound: false,
        muteChatSound: false,
        muteOpponentFoundSound: false,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState<string | undefined>();
    const [hasChanges, setHasChanges] = useState(false);

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        optionContainer: {
            mb: '1.5rem',
        },
        saveButtonContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '1rem',
            mt: '2rem',
            mb: '2rem',
        },
        saveButton: {
            minWidth: '120px',
        },
    };

    // Load user preferences on component mount
    useEffect(() => {
        if (user && user?.preferences?.sound) {
            setSoundPreferences({
                muteAllSound: user.preferences.sound.muteAllSound ?? false,
                volume: user.preferences.sound.volume ?? 0.75,
                muteCardClickSound: user.preferences.sound.muteCardClickSound ?? false,
                muteMenuButtonsSound: user.preferences.sound.muteMenuButtonsSound ?? false,
                muteChatSound: user.preferences.sound.muteChatSound ?? false,
                muteOpponentFoundSound: user.preferences.sound.muteOpponentFoundSound ?? false,
            });
        }else{
            // Load from localStorage for anonymous users
            const localPreferences = loadPreferencesFromLocalStorage();
            setSoundPreferences(localPreferences.sound!);
        }
    }, [user]);

    // Check if there are unsaved changes
    useEffect(() => {
        if (user) {
            const hasUnsavedChanges =
                soundPreferences?.muteAllSound !== (user.preferences.sound?.muteAllSound ?? false) ||
                soundPreferences?.volume !== (user.preferences.sound?.volume ?? 0.75) ||
                soundPreferences?.muteCardClickSound !== (user.preferences.sound?.muteCardClickSound ?? false) ||
                soundPreferences?.muteMenuButtonsSound !== (user.preferences.sound?.muteMenuButtonsSound ?? false) ||
                soundPreferences?.muteChatSound !== (user.preferences.sound?.muteChatSound ?? false) ||
                soundPreferences?.muteOpponentFoundSound !== (user.preferences.sound?.muteOpponentFoundSound ?? false);
            setHasChanges(hasUnsavedChanges);
        }else{
            const localPreferences = loadPreferencesFromLocalStorage();
            const hasUnsavedChanges =
                JSON.stringify(soundPreferences) !== JSON.stringify(localPreferences.sound);

            setHasChanges(hasUnsavedChanges);
        }
    }, [user, soundPreferences]);

    const handlePreferenceChange = (key: string, value: boolean | number) => {
        setSoundPreferences(prev => ({
            ...prev,
            [key]: key === 'volume' ? value as number / 100 : value // Convert percentage to decimal for volume
        }));
        setSaveStatus('idle');
    };

    const handleSavePreferences = async () => {
        if (!user) return;

        setIsSaving(true);
        setSaveStatus('idle');

        try {
            if(user) {
                const success = await saveSoundPreferencesToServer(user, soundPreferences);

                if (success) {
                    // Update user context with new preferences
                    updateUserPreferences({
                        ...user.preferences,
                        sound: soundPreferences
                    });
                    setSaveStatus('success');
                    setSaveMessage('Sound preferences saved successfully.');
                    setHasChanges(false);

                    // Clear success message after 3 seconds
                    setTimeout(() => setSaveStatus('idle'), 3000);
                } else {
                    setSaveStatus('error');
                }
            }else{
                // Save to localStorage for anonymous users
                const currentPreferences = loadPreferencesFromLocalStorage();
                const updatedPreferences = {
                    ...currentPreferences,
                    sound: soundPreferences
                };

                savePreferencesToLocalStorage(updatedPreferences);
                setSaveStatus('success');
                setSaveMessage('Sound preferences saved successfully.');
                setHasChanges(false);
            }
        } catch (error) {
            console.error('Failed to save sound preferences:', error);
            if (error instanceof Error) {
                setSaveMessage(error.message);
            }else{
                setSaveMessage('Unknown Server Error');
            }
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>General Sound</Typography>
                <Divider sx={{ mb: '20px' }}/>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Mute'}
                        optionDescription={'Remove all in-game sounds.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteAllSound', muted)}
                        defaultChecked={soundPreferences?.muteAllSound}
                    />
                </Box>
                <VolumeSlider
                    label="Game Volume"
                    description="Adjust the volume of all game sounds."
                    defaultValue={Math.round((soundPreferences?.volume || 0.75) * 100)}
                    onChange={(value) => handlePreferenceChange('volume', value)}
                    disabled={soundPreferences?.muteAllSound || false}
                />
            </Box>

            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>In-game Sound</Typography>
                <Divider sx={{ mb: '20px' }}/>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Card Clicks'}
                        optionDescription={'Sound when clicking on cards.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteCardClickSound', muted)}
                        defaultChecked={soundPreferences?.muteCardClickSound}
                        disabled={soundPreferences?.muteAllSound}
                    />
                </Box>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Menu Buttons'}
                        optionDescription={'Sound for menu and prompt button interactions.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteMenuButtonsSound', muted)}
                        defaultChecked={soundPreferences?.muteMenuButtonsSound}
                        disabled={soundPreferences?.muteAllSound}
                    />
                </Box>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Chat'}
                        optionDescription={'Sound for incoming chat messages.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteChatSound', muted)}
                        defaultChecked={soundPreferences?.muteChatSound}
                        disabled={soundPreferences?.muteAllSound}
                    />
                </Box>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Opponent Found'}
                        optionDescription={'Sound when an opponent is found.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteOpponentFoundSound', muted)}
                        defaultChecked={soundPreferences?.muteOpponentFoundSound}
                        disabled={soundPreferences?.muteAllSound}
                    />
                </Box>
            </Box>

            {/* Save Button and Status */}
            <Box sx={styles.saveButtonContainer}>
                {saveStatus === 'success' && (
                    <Alert severity="success" sx={{ flexGrow: 1 }}>
                        {saveMessage}
                    </Alert>
                )}
                {saveStatus === 'error' && (
                    <Alert severity="error" sx={{ flexGrow: 1 }}>
                        {saveMessage}
                    </Alert>
                )}

                <Button
                    variant="contained"
                    onClick={handleSavePreferences}
                    disabled={!hasChanges || isSaving || !user?.authenticated}
                    sx={styles.saveButton}
                >
                    {isSaving ? <CircularProgress size={20} /> : 'Save Changes'}
                </Button>
            </Box>
        </>
    );
}

export default SoundOptionsTab;