import * as React from 'react';
import { useState, useEffect, useImperativeHandle, forwardRef, Dispatch, SetStateAction } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider, Alert } from '@mui/material';
import PreferenceOption from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceOption';
import VolumeSlider from '@/app/_components/_sharedcomponents/Preferences/_subComponents/VolumeSlider';
import { useUser } from '@/app/_contexts/User.context';
import {
    loadPreferencesFromLocalStorage,
    savePreferencesToLocalStorage,
    saveSoundPreferencesToServer
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { Preferences } from '@/app/_contexts/UserTypes';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface SoundOptionsTabProps {
    setHasNewChanges?: Dispatch<SetStateAction<boolean>>;
}
function SoundOptionsTab({ setHasNewChanges }: SoundOptionsTabProps) {
    const { user, updateUserPreferences } = useUser();
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
    const [originalPreferences, setOriginalPreferences] = useState<Preferences['sound']>(undefined);

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
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: '1rem',
            mt: '2rem',
            mb: '2rem',
        },
        saveButton: {
            minWidth: '120px',
        },
    };

    const handleVolumeChangeCommitted = (value: number) => {
        const volumeLevel = value / 100;
        try {
            const tempAudio = new Audio('/HelloThere.mp3');
            tempAudio.volume = volumeLevel;
            tempAudio.currentTime = 0;
            tempAudio.play().catch((error) => {
                console.warn('Failed to play volume test sound:', error);
            });
        } catch (error) {
            console.warn('Error playing volume test sound:', error);
        }
    };

    // Load user preferences on component mount
    useEffect(() => {
        let preferences: Preferences['sound'];
        if (user && user?.preferences?.sound) {
            preferences = {
                muteAllSound: user.preferences.sound.muteAllSound ?? false,
                volume: user.preferences.sound.volume ?? 0.75,
                muteCardClickSound: user.preferences.sound.muteCardClickSound ?? false,
                muteMenuButtonsSound: user.preferences.sound.muteMenuButtonsSound ?? false,
                muteChatSound: user.preferences.sound.muteChatSound ?? false,
                muteOpponentFoundSound: user.preferences.sound.muteOpponentFoundSound ?? false,
            };
        } else {
            const localPreferences = loadPreferencesFromLocalStorage();
            preferences = localPreferences.sound!;
        }

        setSoundPreferences(preferences);
        setOriginalPreferences(preferences);
    }, [user]);

    // Check if there are unsaved changes
    useEffect(() => {
        if (!originalPreferences) return;

        const hasUnsavedChanges = JSON.stringify(soundPreferences) !== JSON.stringify(originalPreferences);
        setHasChanges(hasUnsavedChanges);
        if (setHasNewChanges) {
            setHasNewChanges(hasUnsavedChanges)
        }
    }, [soundPreferences, originalPreferences]);

    const handlePreferenceChange = (key: string, value: boolean | number) => {
        setSoundPreferences(prev => ({
            ...prev,
            [key]: key === 'volume' ? value as number / 100 : value
        }));
        setSaveStatus('idle');
    };

    const handleSavePreferences = async (): Promise<boolean> => {
        setIsSaving(true);
        setSaveStatus('idle');

        try {
            if (user) {
                const success = await saveSoundPreferencesToServer(user, soundPreferences);

                if (success) {
                    updateUserPreferences({
                        ...user.preferences,
                        sound: soundPreferences
                    });
                    setOriginalPreferences(soundPreferences);
                    setSaveStatus('success');
                    setSaveMessage('Sound preferences saved successfully.');

                    // in this case we also save to localstorage
                    const currentPreferences = loadPreferencesFromLocalStorage();
                    const updatedPreferences = {
                        ...currentPreferences,
                        sound: soundPreferences
                    };
                    savePreferencesToLocalStorage(updatedPreferences);

                    setTimeout(() => setSaveStatus('idle'), 3000);
                    return true;
                } else {
                    setSaveStatus('error');
                    setSaveMessage('Failed to save preferences to server.');
                    return false;
                }
            } else {
                const currentPreferences = loadPreferencesFromLocalStorage();
                const updatedPreferences = {
                    ...currentPreferences,
                    sound: soundPreferences
                };

                savePreferencesToLocalStorage(updatedPreferences);
                setOriginalPreferences(soundPreferences);
                setSaveStatus('success');
                setSaveMessage('Sound preferences saved successfully.');
                setTimeout(() => setSaveStatus('idle'), 3000);
                return true;
            }
        } catch (error) {
            console.error('Failed to save sound preferences:', error);
            if (error instanceof Error) {
                setSaveMessage(error.message);
            } else {
                setSaveMessage('Unknown Server Error');
            }
            setSaveStatus('error');
            return false;
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
                    defaultValue={Math.round((soundPreferences?.volume ?? 0.75) * 100)}
                    onChange={(value) => handlePreferenceChange('volume', value)}
                    onChangeCommitted={handleVolumeChangeCommitted}
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
                <PreferenceButton
                    variant="standard"
                    buttonFnc={handleSavePreferences}
                    disabled={!hasChanges || isSaving}
                    text={'Save Changes'}
                    sx={styles.saveButton}
                />
                {saveStatus === 'success' && (
                    <Alert severity="success" sx={{ flexGrow: 1, background: 'none', color: 'green' }}>
                        {saveMessage}
                    </Alert>
                )}
                {saveStatus === 'error' && (
                    <Alert severity="error" sx={{ flexGrow: 1, background: 'none', color: 'red' }}>
                        {saveMessage}
                    </Alert>
                )}
            </Box>
        </>
    );
};

export default SoundOptionsTab;