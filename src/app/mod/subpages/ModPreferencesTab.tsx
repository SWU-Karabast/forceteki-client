import React, { useEffect, useState } from 'react';
import { Alert, Box, Divider, FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useUser } from '@/app/_contexts/User.context';
import { DateFormat } from '@/app/_contexts/UserTypes';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDateTime } from '@/app/_utils/dateFormatUtils';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
    { value: DateFormat.MMDDYYYY, label: 'MM/DD/YYYY' },
    { value: DateFormat.DDMMYYYY, label: 'DD/MM/YYYY' },
];

/**
 * Settings that only matter for the mod tools, such as how dates are written in them.
 */
const ModPreferencesTab: React.FC = () => {
    const { user, updateUserPreferences } = useUser();
    const savedDateFormat = useDateFormat();
    const [dateFormat, setDateFormat] = useState<DateFormat>(savedDateFormat);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        setDateFormat(savedDateFormat);
    }, [savedDateFormat]);

    const handleSave = async () => {
        setSaving(true);
        setStatus(null);
        try {
            const result = await savePreferencesGeneric(user, { gameOptions: { dateFormat } }, updateUserPreferences);
            setStatus(result.success
                ? { severity: 'success', message: 'Preferences saved.' }
                : { severity: 'error', message: 'Saving the preferences failed.' });
        } catch (error) {
            setStatus({ severity: 'error', message: error instanceof Error ? error.message : 'Saving the preferences failed.' });
        } finally {
            setSaving(false);
        }
    };

    // ----------------Styles----------------//
    const styles = {
        section: {
            maxWidth: '640px',
        },
        description: {
            mb: '1rem',
            color: '#aaa',
            fontSize: '0.9rem',
        },
        radio: {
            color: '#fff',
            '&.Mui-checked': { color: '#fff' },
        },
        radioLabel: {
            color: '#fff',
            fontSize: '1.1rem',
            fontWeight: 600,
        },
        example: {
            color: '#878787',
            fontSize: '0.95rem',
            ml: '2rem',
            mt: '-0.25rem',
            mb: '0.5rem',
        },
        footer: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            mt: '1.5rem',
        },
    };

    return (
        <Box sx={styles.section}>
            <Typography variant="h2" sx={{ mb: '0.5rem' }}>Date Format</Typography>
            <Divider sx={{ mb: '20px' }} />
            <Typography sx={styles.description}>
                How dates are written in the mod tools.
            </Typography>
            <FormControl component="fieldset">
                <RadioGroup value={dateFormat} onChange={(e) => setDateFormat(e.target.value as DateFormat)}>
                    {DATE_FORMAT_OPTIONS.map((option) => (
                        <Box key={option.value}>
                            <FormControlLabel
                                value={option.value}
                                control={<Radio sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>{option.label}</Typography>}
                            />
                            <Typography sx={styles.example}>For example: {formatDateTime(new Date(), option.value)}</Typography>
                        </Box>
                    ))}
                </RadioGroup>
            </FormControl>

            <Box sx={styles.footer}>
                <PreferenceButton
                    variant="standard"
                    text={saving ? 'Saving…' : 'Save'}
                    disabled={saving || dateFormat === savedDateFormat}
                    buttonFnc={handleSave}
                />
            </Box>
            {status && <Alert severity={status.severity} sx={{ mt: '1rem' }} onClose={() => setStatus(null)}>{status.message}</Alert>}
        </Box>
    );
};

export default ModPreferencesTab;
