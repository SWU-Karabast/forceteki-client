import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Divider, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { useServerSettings } from '@/app/_contexts/ServerSettings.context';
import { IServerSettings } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

const ServerControlsTab: React.FC = () => {
    const { refreshServerSettings } = useServerSettings();

    const [settings, setSettings] = useState<IServerSettings | null>(null);
    const [maintenanceMessage, setMaintenanceMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            const fetched = await ServerApiService.getServerSettingsAsync();
            setSettings(fetched);
            setMaintenanceMessage(fetched.maintenanceMessage ?? '');
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load server settings');
        }
    }, []);

    useEffect(() => {
        void loadSettings();
    }, [loadSettings]);

    const applyUpdate = async (updates: { gamesEnabled?: boolean; maintenanceMessage?: string }) => {
        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            const result = await ServerApiService.setServerSettingsAsync(updates);
            setSettings(result.settings);
            // Only resync the text field when this update actually changed the message, otherwise
            // toggling games would discard a message the moderator had typed but not yet saved.
            if (updates.maintenanceMessage !== undefined) {
                setMaintenanceMessage(result.settings.maintenanceMessage ?? '');
            }
            setSuccessMessage(
                updates.gamesEnabled === undefined
                    ? 'Maintenance message saved.'
                    : `Games are now ${result.settings.gamesEnabled ? 'enabled' : 'disabled'}.`
            );
            // Keep the rest of this tab's own session in step with the change straight away.
            await refreshServerSettings();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update server settings');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleRequested = (nextEnabled: boolean) => {
        setSuccessMessage(null);
        // Turning games back on is safe, but taking the site down warrants a confirm step.
        if (nextEnabled) {
            void applyUpdate({ gamesEnabled: true });
            return;
        }
        setConfirmOpen(true);
    };

    const gamesEnabled = settings?.gamesEnabled ?? false;

    // ======================== STYLES ========================
    const styles = {
        container: {
            maxWidth: '640px',
        },
        section: {
            mb: '2.5rem',
        },
        hint: {
            color: '#878787',
            fontSize: '0.9rem',
            mb: '1rem',
        },
        statusLine: {
            mb: '1rem',
            fontWeight: 600,
        },
        textField: {
            width: '100%',
            mb: '1rem',
            backgroundColor: '#3B4252',
            borderRadius: '5px',
            '& .MuiInputBase-input': { color: 'white' },
        },
        auditLine: {
            color: '#878787',
            fontSize: '0.85rem',
            mt: '0.5rem',
        },
    };

    return (
        <Box sx={styles.container}>
            <Typography variant={'h3'}>Server Controls</Typography>
            <Divider sx={{ mb: '20px' }} />

            {errorMessage && <Alert severity="error" sx={{ mb: '1rem' }}>{errorMessage}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: '1rem' }}>{successMessage}</Alert>}

            <Box sx={styles.section}>
                <Typography sx={styles.statusLine} color={gamesEnabled ? 'lightgreen' : 'orange'}>
                    {gamesEnabled ? 'Games are enabled' : 'Games are disabled — the site is in maintenance mode'}
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            checked={gamesEnabled}
                            disabled={isSaving || !settings}
                            onChange={(event) => handleToggleRequested(event.target.checked)}
                        />
                    }
                    label={gamesEnabled ? 'Games enabled' : 'Games disabled'}
                />
                {settings?.updatedBy && (
                    <Typography sx={styles.auditLine}>
                        Last changed by {settings.updatedBy}
                        {settings.updatedAt ? ` on ${new Date(settings.updatedAt).toLocaleString()}` : ''}
                    </Typography>
                )}
            </Box>

            <Box sx={styles.section}>
                <Typography variant={'h3'}>Maintenance Message</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Typography sx={styles.hint}>
                    Shown to players on the home page and in place of the rematch options while games are
                    disabled. Leave empty to use the default message.
                </Typography>
                <TextField
                    sx={styles.textField}
                    multiline
                    minRows={2}
                    placeholder="Karabast is currently under maintenance. Be back soon!"
                    value={maintenanceMessage}
                    onChange={(event) => setMaintenanceMessage(event.target.value)}
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                />
                <PreferenceButton
                    variant={'standard'}
                    text={isSaving ? 'Saving...' : 'Save Message'}
                    disabled={isSaving || !settings}
                    buttonFnc={() => void applyUpdate({ maintenanceMessage })}
                />
            </Box>

            <ConfirmationDialog
                open={confirmOpen}
                title="Disable games?"
                message={
                    'This puts the whole site into maintenance mode. No new lobbies, quick matches or ' +
                    'rematches can be started. Games already in progress will keep running.'
                }
                onConfirm={() => {
                    setConfirmOpen(false);
                    void applyUpdate({ gamesEnabled: false });
                }}
                onCancel={() => setConfirmOpen(false)}
                confirmButtonText="Disable Games"
                cancelButtonText="Go Back"
            />
        </Box>
    );
};

export default ServerControlsTab;
