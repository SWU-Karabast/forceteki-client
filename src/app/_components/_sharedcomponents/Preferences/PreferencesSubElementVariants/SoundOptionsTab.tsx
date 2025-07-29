import * as React from 'react';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
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
import { IPreferences, ISoundPreferences } from '@/app/_contexts/UserTypes';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { keyframes } from '@mui/system';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';
import { useSoundHandler } from '@/app/_hooks/useSoundHandler';

interface SoundOptionsTabProps {
    setHasNewChanges?: Dispatch<SetStateAction<boolean>>;
}

enum SaveStatus {
    NoChange = 'NoChange',
    Success = 'Success',
    Error = 'Error'
}

const pulseBorder = keyframes`
  0% {
    border-color: rgba(0, 140, 255, 0.4);
    box-shadow: 0 0 4px rgba(0, 140, 255, 0.4);
  }
  50% {
    border-color: rgba(0, 180, 255, 0.6);
    box-shadow: 0 0 8px rgba(0, 180, 255, 0.6);
  }
  100% {
    border-color: rgba(0, 140, 255, 0.4);
    box-shadow: 0 0 4px rgba(0, 140, 255, 0.4);
  }
`;

function SoundOptionsTab({ setHasNewChanges }: SoundOptionsTabProps) {
    const { user, updateUserPreferences } = useUser();
    // Initialize sound handler with user preferences
    const { saveVolumeToLocalStorage, getVolumeFromLocalStorage, getPreferences } = useSoundHandler({
        user,
    });

    const [soundPreferences, setSoundPreferences] = useState<IPreferences['sound']>(() => {
        return getPreferences().sound
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NoChange);

    const [saveMessage, setSaveMessage] = useState<string | undefined>();
    const [hasChanges, setHasChanges] = useState(false);
    const [volume, setVolume] = useState<number>(Math.round(getVolumeFromLocalStorage() * 100));
    const [originalPreferences, setOriginalPreferences] = useState<IPreferences['sound']>(undefined);

    const tempAudio = new Audio('/HelloThere.mp3');

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
            ml:'5px',
            '&:not(:disabled)': {
                background: `linear-gradient(rgb(29, 29, 29), #0a3b4d) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
                '&:hover': {
                    background: `linear-gradient(rgb(29, 29, 29),rgb(20, 65, 81)) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
                },
                animation: `${pulseBorder} 4s infinite ease-in-out`,
                boxShadow: '0 0 6px rgba(0, 140, 255, 0.5)',
                border: '2px solid rgba(0, 140, 255, 0.5)',
            },
        },
    };

    const handleVolumeChangeCommitted = (value: number) => {
        const volumeLevel = value / 100;
        try {
            tempAudio.volume = volumeLevel;
            tempAudio.currentTime = 0;
            tempAudio.play().catch((error) => {
                console.warn('Failed to play volume test sound:', error);
            });
            saveVolumeToLocalStorage(volumeLevel);
        } catch (error) {
            console.warn('Error playing volume test sound:', error);
        }
    };

    // Load user preferences on component mount TODO uncomment later
    /* useEffect(() => {
        let preferences: IPreferences['sound'];
        if (user && user?.preferences?.sound) {
            preferences = {
                muteAllSound: user.preferences.sound.muteAllSound ?? false,
                muteCardAndButtonClickSound: user.preferences.sound.muteCardAndButtonClickSound ?? false,
                muteYourTurn: user.preferences.sound.muteYourTurn ?? false,
                muteChatSound: user.preferences.sound.muteChatSound ?? false,
                muteOpponentFoundSound: user.preferences.sound.muteOpponentFoundSound ?? false,
            };
        } else {
            const localPreferences = loadPreferencesFromLocalStorage();
            preferences = localPreferences.sound!;
        }

        setSoundPreferences(preferences);
        setOriginalPreferences(preferences);
    }, [user]);*/

    // Check if there are unsaved changes
    /* useEffect(() => {
        if (!originalPreferences) return;
        const hasUnsavedChanges =
            JSON.stringify(soundPreferences) !== JSON.stringify(originalPreferences) ||
            volume !== (Math.round(getVolumeFromLocalStorage() * 100));
        setHasChanges(hasUnsavedChanges);
        if (setHasNewChanges) {
            setHasNewChanges(hasUnsavedChanges)
        }
    }, [soundPreferences, originalPreferences, volume]);*/

    const handlePreferenceChange = <T extends keyof ISoundPreferences>(key: T, value: ISoundPreferences[T]) => {
        setSoundPreferences(prev => ({
            ...prev,
            [key]: value
        }));
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        setSaveStatus(SaveStatus.NoChange);
        saveVolumeToLocalStorage(volume/100)
        try {
            const result = await savePreferencesGeneric(
                user,
                { sound: soundPreferences },
                updateUserPreferences
            );
            if (result.success) {
                setOriginalPreferences(soundPreferences);
                setSaveStatus(SaveStatus.Success);
                setSaveMessage('Sound preferences saved successfully.');
                setTimeout(() => setSaveStatus(SaveStatus.NoChange), 3000);
                setHasChanges(false);
                if (setHasNewChanges) {
                    setHasNewChanges(false)
                }
            } else {
                setSaveStatus(SaveStatus.Error);
                setSaveMessage('Failed to save preferences to server.');
            }
        } catch (error) {
            console.error('Failed to save sound preferences:', error);
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
    return (
        <>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>General Sound</Typography>
                <Divider sx={{ mb: '20px' }}/>

                {/* <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Mute'}
                        optionDescription={'Remove all in-game sounds.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteAllSound', muted)}
                        defaultChecked={soundPreferences?.muteAllSound}
                    />
                </Box> */}
                <VolumeSlider
                    label="Game Volume"
                    description="Adjust the volume of all game sounds."
                    defaultValue={volume}
                    onChange={setVolume}
                    onChangeCommitted={handleVolumeChangeCommitted}
                    disabled={soundPreferences?.muteAllSound || false}
                />
            </Box>

            {/* <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h2'}>In-game Sound</Typography>
                <Divider sx={{ mb: '20px' }}/>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Card & Button Clicks'}
                        optionDescription={'Sound when clicking on cards, buttons and prompts.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteCardAndButtonClickSound', muted)}
                        defaultChecked={soundPreferences?.muteCardAndButtonClickSound}
                        disabled={soundPreferences?.muteAllSound}
                    />
                </Box>

                <Box sx={styles.optionContainer}>
                    <PreferenceOption
                        option={'Your turn indicator'}
                        optionDescription={'Sound when it is your turn to perform an action.'}
                        iconType="mute"
                        onChange={(muted) => handlePreferenceChange('muteYourTurn', muted)}
                        defaultChecked={soundPreferences?.muteYourTurn}
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
            </Box> */}

            {/* Save Button and Status */}
            {/* <Box sx={styles.saveButtonContainer}>
                <PreferenceButton
                    variant="standard"
                    buttonFnc={handleSavePreferences}
                    disabled={!hasChanges || isSaving}
                    text={'Save Changes'}
                    sx={styles.saveButton}
                />
                {saveStatus === 'Success' && (
                    <Alert severity="success" sx={{ flexGrow: 1, background: 'none', color: 'green' }}>
                        {saveMessage}
                    </Alert>
                )}
                {saveStatus === 'Error' && (
                    <Alert severity="error" sx={{ flexGrow: 1, background: 'none', color: 'red' }}>
                        {saveMessage}
                    </Alert>
                )}
            </Box> */}
        </>
    );
};
export default SoundOptionsTab;