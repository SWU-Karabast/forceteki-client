import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Typography, Alert } from '@mui/material';
import { useState, useEffect, Dispatch, SetStateAction, useRef, useCallback } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null); // Added for click-outside detection
    
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

    useEffect(() => {
        const shortcuts: IKeyboardShortcuts = {
            ...defaultShortcuts,
            ...(user?.preferences?.keyboardShortcuts || {})
        };
        
        setKeyboardShortcuts(shortcuts);
        setOriginalShortcuts(shortcuts);
    }, [user]);

    useEffect(() => {
        if (!originalShortcuts) return;
        const keysChanged = JSON.stringify(keyboardShortcuts) !== JSON.stringify(originalShortcuts);
        const hasUnsavedChanges = keysChanged;
        setHasChanges(hasUnsavedChanges);
        if (setHasNewChanges) {
            setHasNewChanges(hasUnsavedChanges);
        }
    }, [keyboardShortcuts, originalShortcuts, user, setHasNewChanges]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = ''; 
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    const processKeyBinding = useCallback((keyString: string) => {
        if (!editingKey) return;

        if (keyString === 'ESC' || keyString === 'ESCAPE') {
            setEditingKey(null);
            setConflictError(undefined);
            return;
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
    }, [editingKey]);

    // Listen for keyboard events when recording
    useEffect(() => {
        if (!editingKey) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            let keyString = '';
            if (e.key === ' ') keyString = 'SPACE';
            else if (e.key === 'Control') keyString = 'CTRL';
            else if (e.key === 'Meta') keyString = 'CMD';
            else if (e.key === 'Escape') keyString = 'ESC';
            else keyString = e.key.toUpperCase();

            processKeyBinding(keyString);
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && containerRef.current.contains(e.target as Node)) {
                return;
            }
            setEditingKey(null);
            setConflictError(undefined);
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('mousedown', handleClickOutside, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('mousedown', handleClickOutside, true);
        };
    }, [editingKey, processKeyBinding]);

    const handleSaveShortcuts = async () => {
        setIsSaving(true);
        setSaveStatus(SaveStatus.NoChange);
    
        try {
            const result = await savePreferencesGeneric(
                user, 
                { keyboardShortcuts: keyboardShortcuts }, 
                updateUserPreferences
            );

            if (result.success) {
                setOriginalShortcuts(keyboardShortcuts);
                setSaveStatus(SaveStatus.Success);
                setSaveMessage('Preferences saved successfully!');
                setTimeout(() => setSaveStatus(SaveStatus.NoChange), 3000);
                
                setHasChanges(false);
                if (setHasNewChanges) {
                    setHasNewChanges(false);
                }
            } else {
                setSaveStatus(SaveStatus.Error);
                setSaveMessage('Save failed. Please try again.');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (error instanceof Error) {
                setSaveMessage(error.message);
            } else {
                setSaveMessage('An unexpected error occurred.');
            }
            setSaveStatus(SaveStatus.Error);
        } finally {
            setIsSaving(false);
        }
    };

    const keybindIsNotDefault = 
        JSON.stringify(keyboardShortcuts) !== JSON.stringify(defaultShortcuts);

    const hasBoundKeys = Object.values(keyboardShortcuts).some(val => val !== undefined && val !== null && val !== '');

    const handleResetShortcuts = () => {
        setKeyboardShortcuts(defaultShortcuts);
        setSaveStatus(SaveStatus.NoChange);
        setEditingKey(null);
    };

    const handleStartRecording = (key: keyof IKeyboardShortcuts) => {
        // Treat both undefined and empty string as unbound
        if (keyboardShortcuts[key] === undefined || keyboardShortcuts[key] === '') {
            setEditingKey(key);
        } else {
            setKeyboardShortcuts(prev => ({
                ...prev,
                [key]: ''
            }));
            setSaveStatus(SaveStatus.NoChange);
        }
    };

    return (
        <>
            {saveStatus === SaveStatus.Success && (
                <Alert severity="success" sx={{ mb: '1rem' }}>{saveMessage}</Alert>
            )}
            {saveStatus === SaveStatus.Error && (
                <Alert severity="error" sx={{ mb: '1rem' }}>{saveMessage}</Alert>
            )}
            {conflictError && (
                <Alert severity="warning" sx={{ mb: '1rem' }}>Duplicate Key: {conflictError}</Alert>
            )}

            <Box ref={containerRef} sx={styles.functionContainer}>
                
                <KeyboardLayout 
                    keyboardShortcuts={keyboardShortcuts} 
                    onKeyClick={(key) => processKeyBinding(key)}
                />

                <Box sx={{ mt: 3, mb: 1, px: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Click any shortcut box below to assign a key. You can press the key on your physical keyboard, or click the visual keyboard above. 
                        Clicking a box that already has a key bound to it will unbind it (OPEN). Press <b>ESC</b> or click elsewhere to cancel. 
                    </Typography>
                </Box>
                
                <Grid sx={styles.gridStyle}>
                    {(Object.entries(ShortcutLabels) as [keyof IKeyboardShortcuts, string][]).map(([key, label]) => (
                        <Box key={key} sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                            <Box
                                sx={{
                                    ...styles.keyPadsStyle,
                                    cursor: 'pointer',
                                    backgroundColor: editingKey === key ? '#038FC3' : '#1C2933',
                                }}
                                onClick={() => handleStartRecording(key as keyof IKeyboardShortcuts)}
                            >
                                <Typography variant={'h3'}>
                                    {editingKey === key ? 'Press key...' : (keyboardShortcuts[key as keyof IKeyboardShortcuts] || 'OPEN')}
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
                                acc[key as keyof IKeyboardShortcuts] = '';
                                return acc;
                            }, {} as IKeyboardShortcuts);
                            setKeyboardShortcuts(cleared);
                            setEditingKey(null);
                        }}
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
