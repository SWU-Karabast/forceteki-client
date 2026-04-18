import * as React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import { Divider, Typography, Dialog, DialogTitle, DialogContent, Alert } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { ChangeEvent, useState, useEffect, Dispatch, SetStateAction, useRef } from 'react';
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

const shortcutLabels: Record<keyof IKeyboardShortcuts, string> = {
    menu: 'Menu',
    passTurn: 'Pass / End turn',
    undo: 'Undo',
    concede: 'Concede',
    leaderAbility: 'Leader Ability / Deploy',
    chat: 'Chat',
    modalMinimize: 'Modal Minimize',
    history: 'History',
    claimInitiative: 'Claim Initiative',
    welcomeMessage: 'Welcome Message',
};

function KeyboardShortcutsTab({ setHasNewChanges }: KeyboardShortcutsTabProps) {
    const { user, updateUserPreferences } = useUser();
    
    // Default shortcuts
    const defaultShortcuts: IKeyboardShortcuts = {
        menu: 'ESC',
        passTurn: 'SPACE',
        undo: 'U',
        concede: 'A',
        leaderAbility: 'L',
        // chat: 'C',
        // modalMinimize: 'M',
        // history: 'H',
        claimInitiative: 'I',
        welcomeMessage: 'W',
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
    const [welcomeMessage, setWelcomeMessage] = useState<string>('');
    const [editingKey, setEditingKey] = useState<keyof IKeyboardShortcuts | null>(null);
    const [recordingKey, setRecordingKey] = useState<string>('');
    const [conflictError, setConflictError] = useState<string | undefined>();
    const [unboundKey, setUnboundKey] = useState<keyof IKeyboardShortcuts | null>(null);
    const keyboardShortcutsRef = useRef<IKeyboardShortcuts>(keyboardShortcuts);
    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer:{
            mb:'1.5rem',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
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
        },
        bindButton: {
            backgroundColor: '#1C2933',
            border: '2px solid #038FC3',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            cursor: 'pointer',
            minWidth: '80px',
            fontSize: '0.9rem',
            '&:hover': {
                backgroundColor: '#2a3a47',
            }
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
        const hasUnsavedChanges = JSON.stringify(keyboardShortcuts) !== JSON.stringify(originalShortcuts);
        setHasChanges(hasUnsavedChanges);
        if (setHasNewChanges) {
            setHasNewChanges(hasUnsavedChanges);
        }
    }, [keyboardShortcuts, originalShortcuts, setHasNewChanges]);

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

            if (conflictingKey) {
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
                welcomeMessage: welcomeMessage,
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
                setSaveMessage('Unauthorized: Please check your login.');
            }
        } catch (error) {
            console.error('Save error:', error);
            setSaveStatus(SaveStatus.Error);
            setSaveMessage('An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetShortcuts = () => {
        if (originalShortcuts) {
            setKeyboardShortcuts(originalShortcuts);
            setSaveStatus(SaveStatus.NoChange);
            setUnboundKey(null);
        }
    };

    const handleUnbindShortcuts = () => {
    // Create a new object with all values set to undefined
        const unboundShortcuts = Object.keys(keyboardShortcuts).reduce((acc, key) => {
            acc[key as keyof IKeyboardShortcuts] = undefined;
            return acc;
        }, {} as IKeyboardShortcuts);

        setKeyboardShortcuts(unboundShortcuts);
        setSaveStatus(SaveStatus.NoChange);
        setUnboundKey(null); // Clear any specific recording states
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
            setUnboundKey(key); // Optional: keeps your UI highlighting consistent
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
                                backgroundColor: editingKey === 'menu' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('menu')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'menu' ? 'Press key...' : unboundKey === 'menu' ? '' : (keyboardShortcuts.menu || '')}
                            </Typography>
                        </Box>
                        <Typography>Menu</Typography>
                    </Box>
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
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'concede' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('concede')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'concede' ? 'Press key...' : unboundKey === 'concede' ? '' : (keyboardShortcuts.concede || '')}
                            </Typography>
                        </Box>
                        <Typography>Concede</Typography>
                    </Box>
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'leaderAbility' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('leaderAbility')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'leaderAbility' ? 'Press key...' : unboundKey === 'leaderAbility' ? '' : (keyboardShortcuts.leaderAbility || '')}
                            </Typography>
                        </Box>
                        <Typography>Leader Ability / Deploy</Typography>
                    </Box>
                    {/* Chat option - commented out for future use
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'chat' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('chat')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'chat' ? 'Press key...' : unboundKey === 'chat' ? '' : (keyboardShortcuts.chat || '')}
                            </Typography>
                        </Box>
                        <Typography>Chat</Typography>
                    </Box>
                    */}
                    {/* Modal Minimize option - commented out for future use
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'modalMinimize' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('modalMinimize')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'modalMinimize' ? 'Press key...' : unboundKey === 'modalMinimize' ? '' : (keyboardShortcuts.modalMinimize || '')}
                            </Typography>
                        </Box>
                        <Typography>Modal Minimize</Typography>
                    </Box>
                    */}
                    {/* History option - commented out for future use
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'history' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('history')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'history' ? 'Press key...' : unboundKey === 'history' ? '' : (keyboardShortcuts.history || '')}
                            </Typography>
                        </Box>
                        <Typography>History</Typography>
                    </Box>
                    */}
                    <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                        <Box
                            sx={{
                                ...styles.keyPadsStyle,
                                cursor: 'pointer',
                                backgroundColor: editingKey === 'claimInitiative' ? '#038FC3' : '#1C2933',
                            }}
                            onClick={() => handleStartRecording('claimInitiative')}
                        >
                            <Typography variant={'h3'}>
                                {editingKey === 'claimInitiative' ? 'Press key...' : unboundKey === 'claimInitiative' ? '' : (keyboardShortcuts.claimInitiative || '')}
                            </Typography>
                        </Box>
                        <Typography>Claim Initiative</Typography>
                    </Box>
                </Grid>
            </Box>
            <Box sx={{ ...styles.functionContainer, mb:'0px' }}>
                <Divider sx={{ mb:'20px' }}/>
                <Box sx={{ display:'flex', flexDirection:'row', alignItems:'center' }}>
                    <Box
                        sx={{
                            ...styles.keyPadsStyle,
                            cursor: 'pointer',
                            backgroundColor: editingKey === 'welcomeMessage' ? '#038FC3' : '#1C2933',
                        }}
                        onClick={() => handleStartRecording('welcomeMessage')}
                    >
                        <Typography variant={'h3'}>
                            {editingKey === 'welcomeMessage' ? 'Press key...' : unboundKey === 'welcomeMessage' ? '' : (keyboardShortcuts.welcomeMessage || '')}
                        </Typography>
                    </Box>
                    <Typography sx={{ mb:'0px', mr:'10px' }}>Welcome Message: </Typography>
                    <StyledTextField
                        type="text"
                        value={welcomeMessage}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setWelcomeMessage(e.target.value)
                        }
                        placeholder="Good luck, have fun!"
                        sx={{ width:'50%' }}
                    />
                </Box>
            </Box>
            <Box sx={styles.saveButtonContainer}>
                <Box sx={{ display: 'flex', gap: '1rem' }}>
                    <PreferenceButton
                        variant="standard"
                        buttonFnc={handleResetShortcuts}
                        disabled={!hasChanges || isSaving}
                        text={'Reset'}
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
