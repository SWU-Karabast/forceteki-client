import * as React from 'react';
import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider, Alert, RadioGroup, FormControlLabel, Radio, FormControl, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useUser } from '@/app/_contexts/User.context';
import {
    loadPreferencesFromLocalStorage,
} from '@/app/_utils/ServerAndLocalStorageUtils';
import { IPreferences } from '@/app/_contexts/UserTypes';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { keyframes } from '@mui/system';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';

interface AnimationOptionsTabProps {
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

// Define animation mode type
type AnimationMode = 'all' | 'disabled' | 'onlyDamage';

function AnimationOptionsTab({ setHasNewChanges }: AnimationOptionsTabProps) {
    const { user, updateUserPreferences } = useUser();

    // Helper function to get animation mode from preferences
    const getAnimationModeFromPreferences = (prefs: IPreferences['animations']): AnimationMode => {
        if (prefs?.disableAnimations) {
            return 'disabled';
        } else if (prefs?.onlyDamageAnimations) {
            return 'onlyDamage';
        } else {
            return 'all';
        }
    };

    const [animationMode, setAnimationMode] = useState<AnimationMode>(() => {
        if (user && user?.preferences?.animations) {
            return getAnimationModeFromPreferences(user.preferences.animations);
        } else {
            const localPreferences = loadPreferencesFromLocalStorage();
            return getAnimationModeFromPreferences(localPreferences.animations);
        }
    });

    const [fastAnimations, setFastAnimations] = useState<boolean>(() => {
        if (user && user?.preferences?.animations?.fastAnimations !== undefined) {
            return user.preferences.animations.fastAnimations;
        } else {
            const localPreferences = loadPreferencesFromLocalStorage();
            return localPreferences.animations?.fastAnimations ?? false;
        }
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NoChange);
    const [saveMessage, setSaveMessage] = useState<string | undefined>();
    const [hasChanges, setHasChanges] = useState(false);
    const [originalMode, setOriginalMode] = useState<AnimationMode>('all');
    const [originalFastAnimations, setOriginalFastAnimations] = useState<boolean>(false);

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
        },
        radioGroup: {
            ml: '5px',
            gap: '0.25rem',
        },
        radioOption: {
            mb: '0.25rem',
            alignItems: 'flex-start',
            '& .MuiRadio-root': {
                color: 'rgba(128, 128, 128, 0.5)', // Grey for unchecked
                '&.Mui-checked': {
                    color: '#038FC3', // Blue for checked
                },
            },
            '& .MuiFormControlLabel-label': {
                fontSize: '1rem',
                marginTop: '8px', // Align text better with radio button
            },
        },
        speedToggleContainer: {
            mt: '2rem',
            ml: '5px',
        },
        speedToggle: {
            '& .MuiToggleButton-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'rgba(128, 128, 128, 0.2)',
                border: '1px solid rgba(128, 128, 128, 0.3)',
                padding: '8px 24px',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                    backgroundColor: 'rgba(128, 128, 128, 0.3)',
                },
                '&.Mui-selected': {
                    color: '#fff',
                    backgroundColor: '#038FC3',
                    border: '1px solid #038FC3',
                    '&:hover': {
                        backgroundColor: '#027BA8',
                    },
                },
            },
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

    // Load user preferences on component mount
    useEffect(() => {
        let mode: AnimationMode;
        let fast: boolean;
        if (user && user?.preferences?.animations) {
            mode = getAnimationModeFromPreferences(user.preferences.animations);
            fast = user.preferences.animations.fastAnimations ?? false;
        } else {
            const localPreferences = loadPreferencesFromLocalStorage();
            mode = getAnimationModeFromPreferences(localPreferences.animations);
            fast = localPreferences.animations?.fastAnimations ?? false;
        }

        setAnimationMode(mode);
        setOriginalMode(mode);
        setFastAnimations(fast);
        setOriginalFastAnimations(fast);
    }, [user]);

    // Check if there are unsaved changes
    useEffect(() => {
        const hasUnsavedChanges = animationMode !== originalMode || fastAnimations !== originalFastAnimations;
        setHasChanges(hasUnsavedChanges);
        if (setHasNewChanges) {
            setHasNewChanges(hasUnsavedChanges);
        }
    }, [animationMode, originalMode, fastAnimations, originalFastAnimations, setHasNewChanges]);

    const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAnimationMode(event.target.value as AnimationMode);
        setSaveStatus(SaveStatus.NoChange);
    };

    const handleSpeedChange = (_event: React.MouseEvent<HTMLElement>, newSpeed: 'slow' | 'fast' | null) => {
        if (newSpeed !== null) {
            setFastAnimations(newSpeed === 'fast');
            setSaveStatus(SaveStatus.NoChange);
        }
    };

    const handleSavePreferences = async () => {
        setIsSaving(true);
        setSaveStatus(SaveStatus.NoChange);

        // Construct preferences based on current mode and speed
        const animationPreferences = {
            disableAnimations: animationMode === 'disabled',
            onlyDamageAnimations: animationMode === 'onlyDamage',
            fastAnimations
        };

        try {
            const result = await savePreferencesGeneric(
                user,
                { animations: animationPreferences },
                updateUserPreferences
            );

            if (result.success) {
                setOriginalMode(animationMode);
                setOriginalFastAnimations(fastAnimations);
                setSaveStatus(SaveStatus.Success);
                setSaveMessage('Animation preferences saved successfully.');
                setTimeout(() => setSaveStatus(SaveStatus.NoChange), 3000);
                setHasChanges(false);
                if (setHasNewChanges) {
                    setHasNewChanges(false);
                }
            } else {
                setSaveStatus(SaveStatus.Error);
                setSaveMessage('Failed to save preferences to server.');
            }
        } catch (error) {
            console.error('Failed to save animation preferences:', error);
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
                <Typography sx={styles.typographyContainer} variant={'h2'}>Animation Settings</Typography>
                <Divider sx={{ mb: '20px' }}/>

                <FormControl component="fieldset">
                    <RadioGroup
                        value={animationMode}
                        onChange={handleModeChange}
                        sx={styles.radioGroup}
                    >
                        <FormControlLabel
                            value="all"
                            control={<Radio />}
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight="bold">Show All Animations</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Full visual experience with all animations enabled.
                                    </Typography>
                                </Box>
                            }
                            sx={styles.radioOption}
                        />
                        <FormControlLabel
                            value="onlyDamage"
                            control={<Radio />}
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight="bold">Show Only Damage Animations</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Show damage, defeat, and shield break animations only.
                                    </Typography>
                                </Box>
                            }
                            sx={styles.radioOption}
                        />
                        <FormControlLabel
                            value="disabled"
                            control={<Radio />}
                            label={
                                <Box>
                                    <Typography variant="body1" fontWeight="bold">Disable All Animations</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Turn off all animations for better performance or accessibility.
                                    </Typography>
                                </Box>
                            }
                            sx={styles.radioOption}
                        />
                    </RadioGroup>
                </FormControl>

                {/* Animation Speed Toggle */}
                <Box sx={styles.speedToggleContainer}>
                    <Typography variant="body1" fontWeight="bold" sx={{ mb: '0.5rem' }}>
                        Animation Speed
                    </Typography>
                    <ToggleButtonGroup
                        value={fastAnimations ? 'fast' : 'slow'}
                        exclusive
                        onChange={handleSpeedChange}
                        aria-label="animation speed"
                        sx={styles.speedToggle}
                    >
                        <ToggleButton value="slow" aria-label="slow animations">
                            Slow
                        </ToggleButton>
                        <ToggleButton value="fast" aria-label="fast animations">
                            Fast
                        </ToggleButton>
                    </ToggleButtonGroup>
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
            </Box>
        </>
    );
}

export default AnimationOptionsTab;
