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

export enum ShortcutLabels {
    passTurn = 'Pass / End turn',
    undo = 'Undo',
}

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
    const [saveMessage, setSaveMessage] = useState<string>('');
    const [hasChanges, setHasChanges] = useState(false);
    const [originalShortcuts, setOriginalShortcuts] = useState<IKeyboardShortcuts | undefined>();
    const [editingKey, setEditingKey] = useState<keyof IKeyboardShortcuts | null>(null);
    const [conflictError, setConflictError] = useState<string | undefined>();
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
        const shortcuts: IKeyboardShortcuts = {
            ...defaultShortcuts,
            ...(user?.preferences?.keyboardShortcuts || {})
        };
        
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

    // Listen for keyboard events when recording
    useEffect(() => {
        if (!editingKey) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.key === 'Escape') {
                setEditingKey(null);
                setConflictError(undefined);
                return;
            }

            let keyString = '';

            if (e.key === ' ') {
                keyString = 'SPACE';
            } else if (e.key === 'Control') {
                keyString = 'CTRL';
            } else if (e.key === 'Meta') {
                keyString = 'CMD';
            } else if (e.key.length === 1) {
                keyString = e.key.toUpperCase();
            } else {
                keyString = e.key.toUpperCase();
            }

            let conflictingKey: keyof IKeyboardShortcuts | null = null;
            
            for (const [key, value] of Object.entries(keyboardShortcutsRef.current)) {
                if (key !== editingKey && value?.toUpperCase() === keyString) {
                    conflictingKey = key as keyof IKeyboardShortcuts;
                    break;
                }
            }

            if (conflictingKey && ShortcutLabels[conflictingKey as keyof typeof ShortcutLabels]) {
                setConflictError(`"${keyString}" is already assigned to ${ShortcutLabels[conflictingKey as keyof typeof ShortcutLabels]}`);
                setEditingKey(null);
                setTimeout(() => setConflictError(undefined), 4000);
                return;
            }

            setConflictError(undefined);
            setKeyboardShortcuts(prev => ({
                ...prev,
                [editingKey]: keyString
            }));
            setSaveStatus(SaveStatus.NoChange);
            setEditingKey(null);
        };

        const handleClickOutside = () => {
            setEditingKey(null);
            setConflictError(undefined);
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('mousedown', handleClickOutside, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('mousedown', handleClickOutside, true);
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

    const keybindIsNotDefault = 
        JSON.stringify(keyboardShortcuts) !== JSON.stringify(defaultShortcuts);

    // Checks if at least one key in the state is bound (not undefined, null, or empty string)
    const hasBoundKeys = Object.values(keyboardShortcuts).some(val => val !== undefined && val !== null && val !== '');

    const handleResetShortcuts = () => {
        setKeyboardShortcuts(defaultShortcuts);
        setSaveStatus(SaveStatus.NoChange);
        setEditingKey(null);
    };

    const handleStartRecording = (key: keyof IKeyboardShortcuts) => {
        if (keyboardShortcuts[key] === undefined) {
            setEditingKey(key);
        } else {
            setKeyboardShortcuts(prev => ({
                ...prev,
                [key]: undefined
            }));
            setSaveStatus(SaveStatus.NoChange);
        }
    };

    return (
        <>
            {/* Alerts moved to the very top */}
            {saveStatus === SaveStatus.Success && (
                <Alert severity="success" sx={{ mb: '1rem' }}>{saveMessage}</Alert>
            )}
            {saveStatus === SaveStatus.Error && (
                <Alert severity="error" sx={{ mb: '1rem' }}>{saveMessage}</Alert>
            )}
            {conflictError && (
                <Alert severity="warning" sx={{ mb: '1rem' }}>Duplicate Key: {conflictError}</Alert>
            )}

            <Box sx={styles.functionContainer}>
                <KeyboardLayout keyboardShortcuts={keyboardShortcuts} />
                
                {/* Dynamically iterate over ShortcutLabels */}
                <Grid sx={styles.gridStyle}>
                    {(Object.entries(ShortcutLabels) as [keyof IKeyboardShortcuts, string][]).map(([key, label]) => (
                        <Box key={key} sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                            <Box
                                sx={{
                                    ...styles.keyPadsStyle,
                                    cursor: 'pointer',
                                    backgroundColor: editingKey === key ? '#038FC3' : '#1C2933',
                                }}
                                onClick={() => handleStartRecording(key)}
                            >
                                <Typography variant={'h3'}>
                                    {editingKey === key ? 'Press key...' : (keyboardShortcuts[key] || 'OPEN (Click to bind)')}
                                </Typography>
                            </Box>
                            <Typography>{label}</Typography>
                        </Box>
                    ))}
                </Grid>
            </Box>

            <Box sx={styles.saveButtonContainer}>
                <Box sx={{ display: 'flex', gap: '1rem' }}>
                    <PreferenceButton
                        variant="standard"
                        buttonFnc={handleResetShortcuts}
                        disabled={!keybindIsNotDefault || isSaving} 
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
                            setEditingKey(null);
                        }}
                        // Disabled if there are no keys bound to unbind
                        disabled={isSaving || !hasBoundKeys}
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
