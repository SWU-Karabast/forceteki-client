import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Typography, Alert } from '@mui/material';
import { useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';
import KeyboardLayout from '@/app/_components/_sharedcomponents/Preferences/_subComponents/KeyboardLayout';
import { useUser } from '@/app/_contexts/User.context';
import { IKeyboardShortcuts, IPreferences } from '@/app/_contexts/UserTypes';
import { loadPreferencesFromLocalStorage } from '@/app/_utils/ServerAndLocalStorageUtils';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { keyframes } from '@mui/system';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';

interface KeyboardShortcutsTabProps {
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

const shortcutLabels: Partial<Record<keyof IKeyboardShortcuts, string>> = {
    passTurn: 'Pass / End turn',
    undo: 'Undo',
};

function KeyboardShortcutsTab({ setHasNewChanges }: KeyboardShortcutsTabProps) {
    const { user, updateUserPreferences } = useUser();
    
    // Default shortcuts
    const defaultShortcuts: IKeyboardShortcuts = {
        passTurn: 'SPACE',
        undo: 'U',
    };

    const [keyboardShortcuts, setKeyboardShortcuts] = useState<IKeyboardShortcuts>(() => {
        const localPrefs = loadPreferencesFromLocalStorage();
        return { ...defaultShortcuts, ...localPrefs.keyboardShortcuts };
    });

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>(SaveStatus.NoChange);
    const [saveMessage, setSaveMessage] = useState<string | undefined>();
    const [hasChanges, setHasChanges] = useState(false);
    const [originalShortcuts, setOriginalShortcuts] = useState<IKeyboardShortcuts | undefined>();
    const [editingKey, setEditingKey] = useState<keyof IKeyboardShortcuts | null>(null);
    const [conflictError, setConflictError] = useState<string | undefined>();
    const [unboundKey, setUnboundKey] = useState<keyof IKeyboardShortcuts | null>(null);
    const keyboardShortcutsRef = useRef<IKeyboardShortcuts>(keyboardShortcuts);
    
    const styles = {
        functionContainer:{
            mb:'1.5rem',
        },
        keyboardStyle:{
            height: '17rem',
            width: '100%',
            mb:'30px',
        },
        keyPadsStyle:{
            backgroundColor: '#1C2933',
            width: 'fit-content',
            padding: '0.5rem',
            borderRadius: '5px',
            mr:'10px',
            minWidth:'42px',
            textAlign: 'center',
        },
        gridStyle:{
            mt:'20px',
            gap:'20px',
            gridTemplateColumns: 'auto auto auto',
            display:'grid',
        },
        saveButtonContainer: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
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
        }
    };

    // Load user preferences on component mount
    useEffect(() => {
        let shortcuts: IKeyboardShortcuts;
        if (user && user?.preferences?.keyboardShortcuts) {
            shortcuts = { ...defaultShortcuts, ...user.preferences.keyboardShortcuts };
        } else {
            const localPreferences = loadPreferencesFromLocalStorage();
            shortcuts = { ...defaultShortcuts, ...localPreferences.keyboardShortcuts };
        }
        setKeyboardShortcuts(shortcuts);
        setOriginalShortcuts(shortcuts);
    }, [user]);

    // Check if there are unsaved changes
    useEffect(() => {
        if (!originalShortcuts) return;
        const keysChanged = JSON.stringify(keyboardShortcuts) !== JSON.stringify(originalShortcuts);
        const hasUnsavedChanges = keysChanged;
        setHasChanges(hasUnsavedChanges);
        if (setHasNewChanges) {
            setHasNewChanges(hasUnsavedChanges);
        }
    }, [keyboardShortcuts, originalShortcuts, user, setHasNewChanges]);

    // Keep ref in sync with current keyboard shortcuts
    useEffect(() => {
        keyboardShortcutsRef.current = keyboardShortcuts;
    }, [keyboardShortcuts]);

    // Listen for keyboard events when recording
    useEffect(() => {
        if (!editingKey) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            let keyString = '';

            // Handle modifier keys and letter keys
            if (e.ctrlKey) keyString += 'Ctrl+';
            if (e.altKey) keyString += 'Alt+';
            if (e.metaKey) keyString += 'Cmd+';
            if (e.shiftKey && e.key !== 'Shift') keyString += 'Shift+';

            if (e.key === ' ') {
                keyString += 'Space';
            } else if (e.key === 'Escape') {
                keyString += 'ESC';
            } else if (e.key.length === 1) {
                keyString += e.key.toUpperCase();
            } else if (e.key.startsWith('Arrow')) {
                keyString += e.key;
            } else {
                keyString += e.key;
            }

            // Check for duplicate key using ref (always has current value)
            const uppercaseValue = keyString.toUpperCase();
            let conflictingKey: keyof IKeyboardShortcuts | null = null;
            
            for (const [key, value] of Object.entries(keyboardShortcutsRef.current)) {
                if (key !== editingKey && value?.toUpperCase() === uppercaseValue) {
                    conflictingKey = key as keyof IKeyboardShortcuts;
                    break;
                }
            }

            if (conflictingKey && shortcutLabels[conflictingKey]) {
                setConflictError(`"${uppercaseValue}" is already assigned to ${shortcutLabels[conflictingKey]}`);
                setEditingKey(null);
                setTimeout(() => setConflictError(undefined), 4000);
                return;
            }

            // No conflict, update the shortcut
            setConflictError(undefined);
            setKeyboardShortcuts(prev => ({
                ...prev,
                [editingKey]: uppercaseValue
            }));
            setSaveStatus(SaveStatus.NoChange);
            setUnboundKey(null);
            setEditingKey(null);
        };

        document.addEventListener('keydown', handleKeyDown, true);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [editingKey]);

    const handleSaveShortcuts = async () => {
        setIsSaving(true);
        setSaveStatus(SaveStatus.NoChange);
    
        try {
            const newPreferences: IPreferences = {
                ...user?.preferences,
                keyboardShortcuts: keyboardShortcuts,
            };
            
            const result = await savePreferencesGeneric(
                user, 
                newPreferences, 
                updateUserPreferences
            );

            if (result.success) {
                setSaveStatus(SaveStatus.Success);
                setSaveMessage('Preferences saved successfully!');
                setOriginalShortcuts(keyboardShortcuts);
                setTimeout(() => setSaveStatus(SaveStatus.NoChange), 3000);
            } else {
                setSaveStatus(SaveStatus.Error);
                setSaveMessage('Save failed. Please try again.');
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveStatus(SaveStatus.Error);
            setSaveMessage('An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const isNotDefault = 
        JSON.stringify(keyboardShortcuts) !== JSON.stringify(defaultShortcuts)

    const handleResetShortcuts = () => {
        setKeyboardShortcuts(defaultShortcuts);
        setSaveStatus(SaveStatus.NoChange);
        setUnboundKey(null);
        setEditingKey(null);
    };

    const handleStartRecording = (key: keyof IKeyboardShortcuts) => {
        // If we click a key that is already unbound (undefined), start recording
        if (keyboardShortcuts[key] === undefined) {
            setEditingKey(key);
        } else {
            // If it has a value, first click unbinds it
            setKeyboardShortcuts(prev => ({
                ...prev,
                [key]: undefined
            }));
            setUnboundKey(key); 
            setSaveStatus(SaveStatus.NoChange);
        }
    };

    return (
        <>
            <Box sx={styles.functionContainer}>
                <KeyboardLayout keyboardShortcuts={keyboardShortcuts} />
                {saveStatus === SaveStatus.Success && (
                    <Alert severity="success" sx={{ mt: '1rem' }}>{saveMessage}</Alert>
                )}
                {saveStatus === SaveStatus.Error && (
                    <Alert severity="error" sx={{ mt: '1rem' }}>{saveMessage}</Alert>
                )}
                {conflictError && (
                    <Alert severity="warning" sx={{ mt: '1rem' }}>Duplicate Key: {conflictError}</Alert>
                )}
                <Grid sx={styles.gridStyle}>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'passTurn' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('passTurn')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'passTurn' ? 'Press key...' : unboundKey === 'passTurn' ? '' : (keyboardShortcuts.passTurn || '')}
                            </Typography>
                        </Box>
                        <Typography>Pass / End turn</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'undo' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('undo')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'undo' ? 'Press key...' : unboundKey === 'undo' ? '' : (keyboardShortcuts.undo || '')}
                            </Typography>
                        </Box>
                        <Typography>Undo</Typography>
                    </Box>
                </Grid>
            </Box>

            <Box sx={styles.saveButtonContainer}>
                <Box sx={{ display: 'flex', gap: '1rem' }}>
                    <PreferenceButton
                        variant="standard"
                        buttonFnc={handleResetShortcuts}
                        disabled={!isNotDefault || isSaving} 
                        text={'Reset to Defaults'}
                        sx={styles.saveButton}
                    />
                    <PreferenceButton
                        variant="standard"
                        buttonFnc={() => {
                            const cleared = Object.keys(keyboardShortcuts).reduce((acc, key) => {
                                acc[key as keyof IKeyboardShortcuts] = undefined;
                                return acc;
                            }, {} as IKeyboardShortcuts);
                            setKeyboardShortcuts(cleared);
                            setUnboundKey(null);
                            setEditingKey(null);
                        }}
                        disabled={isSaving}
                        text={'Unbind all'}
                        sx={styles.saveButton}
                    />
                </Box>

                <Box sx={{ flexGrow: 1 }} />

                <PreferenceButton
                    variant="standard"
                    buttonFnc={handleSaveShortcuts}
                    disabled={!hasChanges || isSaving}
                    text={isSaving ? 'Saving...' : 'Save Changes'}
                    sx={styles.saveButton}
                />
            </Box>
        </>
    );
}

export default KeyboardShortcutsTab;
