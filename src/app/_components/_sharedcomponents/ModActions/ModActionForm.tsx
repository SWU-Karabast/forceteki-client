import React, { useState } from 'react';
import { Box, Checkbox, Chip, FormControlLabel, MenuItem, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import {
    DurationUnit,
    modActionDefinitions,
    ModActionType,
    RESET_USERNAME_PREFIX,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import {
    describeModActionRequest,
    getModActionUnavailableReason,
    getNewUsernameError,
    IModActionRequest,
    IModActionResult,
    IModActionTarget,
    MOD_ACTION_HELP_TEXT,
    MOD_ACTION_NOTE_TEMPLATES,
    MOD_ACTION_ORDER,
    MUTE_DURATION_PRESETS_DAYS,
    pickResetUsername,
    submitModActionAsync,
} from '@/app/_utils/modActionSubmission';

const DAYS_PER_WEEK = 7;

export interface IModActionFormProps {
    target: IModActionTarget;

    /** The report ticket the action is issued from, if any */
    reportId?: string;

    /** Appended to the confirmation, e.g. what happens to the ticket */
    confirmationSuffix?: string;

    /** Rendered above the submit button, e.g. ticket options */
    extraOptions?: React.ReactNode;

    /** For a form inside a dialog, so the confirmation shows above it */
    confirmationZIndex?: number;

    /** Called once the server answered, whether or not the action was applied */
    onSubmitted: (result: IModActionResult, request: IModActionRequest) => Promise<void> | void;

    /** The request itself failed (network, server error) */
    onError: (message: string) => void;
}

const formatPreset = (days: number): string => {
    const weeks = days / DAYS_PER_WEEK;
    return Number.isInteger(weeks) ? `${weeks} Week${weeks === 1 ? '' : 's'}` : `${days} Days`;
};

/**
 * Picking, describing and submitting a mod action against one player. Used by the player view and by report
 * tickets, so both offer the same actions with the same rules.
 */
const ModActionForm: React.FC<IModActionFormProps> = ({
    target,
    reportId,
    confirmationSuffix,
    extraOptions,
    confirmationZIndex,
    onSubmitted,
    onError,
}) => {
    const [actionType, setActionType] = useState<ModActionType>(ModActionType.Warning);
    const [durationValue, setDurationValue] = useState('');
    const [durationUnit, setDurationUnit] = useState<DurationUnit>(DurationUnit.Days);
    const [newUsername, setNewUsername] = useState('');
    const [resetUsername, setResetUsername] = useState(false);
    const [resetName, setResetName] = useState<string | undefined>(undefined);
    const [note, setNote] = useState('');
    const [showNoteError, setShowNoteError] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const definition = modActionDefinitions[actionType];
    const parsedDuration = parseInt(durationValue);
    const durationDays = parsedDuration > 0 ? parsedDuration * (durationUnit === DurationUnit.Weeks ? DAYS_PER_WEEK : 1) : 0;
    const newUsernameError = definition.requiresNewUsername ? getNewUsernameError(newUsername, target.username) : null;
    const unavailableReason = getModActionUnavailableReason(actionType, target);
    const templates = MOD_ACTION_NOTE_TEMPLATES[actionType] ?? [];

    const canSubmit = !submitting
        && !unavailableReason
        && (!definition.requiresDuration || durationDays > 0)
        && (!definition.requiresNewUsername || (!!newUsername.trim() && !newUsernameError));

    const selectActionType = (value: ModActionType) => {
        setActionType(value);
        setNewUsername('');
        setResetUsername(false);
        setShowNoteError(false);
    };

    const applyPreset = (days: number) => {
        const weeks = days / DAYS_PER_WEEK;
        setDurationValue(String(Number.isInteger(weeks) ? weeks : days));
        setDurationUnit(Number.isInteger(weeks) ? DurationUnit.Weeks : DurationUnit.Days);
    };

    const applyTemplate = (template: string) => {
        setNote((current) => (current.trim() ? `${current.trim()} ${template}` : template));
        setShowNoteError(false);
    };

    const resetForm = () => {
        setDurationValue('');
        setDurationUnit(DurationUnit.Days);
        setNewUsername('');
        setResetUsername(false);
        setNote('');
    };

    const handleSubmitClick = () => {
        if (definition.requiresNote && !note.trim()) {
            setShowNoteError(true);
            return;
        }
        // Decided before confirming so the confirmation can name the new username
        setResetName(pickResetUsername(actionType, resetUsername, target.username));
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setConfirmOpen(false);
        const request: IModActionRequest = {
            playerId: target.playerId,
            currentUsername: target.username,
            actionType,
            note: note.trim(),
            durationDays: definition.requiresDuration ? durationDays : undefined,
            newUsername: newUsername.trim(),
            resetRequested: resetUsername,
            resetName,
            reportId,
        };

        setSubmitting(true);
        try {
            const result = await submitModActionAsync(request);
            if (result.mainActionApplied) {
                resetForm();
            }
            await onSubmitted(result, request);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Failed to submit the action');
        } finally {
            setSubmitting(false);
        }
    };

    const description = describeModActionRequest(actionType, target.username, { durationDays, newUsername, resetName });

    // ----------------Styles----------------//
    const styles = {
        row: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.75rem',
            alignItems: 'center',
            mb: '0.75rem',
        },
        actionSelect: {
            minWidth: '220px',
        },
        durationField: {
            width: '110px',
            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none' },
        },
        unitField: {
            width: '120px',
        },
        chipRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.4rem',
            mb: '0.5rem',
        },
        chip: {
            color: '#B0B0B0',
            borderColor: '#4A5568',
            fontSize: '0.75rem',
            '&:hover': { color: 'white', borderColor: '#2F7DB6' },
        },
        checkboxLabel: {
            color: 'white',
            mb: '0.25rem',
            '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
        },
        checkbox: {
            color: '#B0B0B0',
            '&.Mui-checked': { color: '#2F7DB6' },
        },
        helpText: {
            color: '#B0B0B0',
            fontSize: '0.75rem',
            mb: '0.5rem',
        },
        unavailableText: {
            color: '#ffd54f',
            fontSize: '0.8rem',
            fontWeight: 600,
            mb: '0.5rem',
        },
        footer: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            mt: '0.75rem',
        },
    };

    return (
        <Box>
            <Box sx={styles.row}>
                <StyledTextField
                    select
                    label="Action"
                    value={actionType}
                    onChange={(e) => selectActionType(e.target.value as ModActionType)}
                    size="small"
                    fullWidth={false}
                    sx={styles.actionSelect}
                >
                    {MOD_ACTION_ORDER.map((type) => (
                        <MenuItem key={type} value={type}>{modActionDefinitions[type].label}</MenuItem>
                    ))}
                </StyledTextField>

                {definition.requiresDuration && (
                    <>
                        <StyledTextField
                            type="number"
                            placeholder="Duration"
                            value={durationValue}
                            onChange={(e) => setDurationValue(e.target.value)}
                            size="small"
                            fullWidth={false}
                            inputProps={{ min: 1, step: 1 }}
                            sx={styles.durationField}
                        />
                        <StyledTextField
                            select
                            value={durationUnit}
                            onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                            size="small"
                            fullWidth={false}
                            sx={styles.unitField}
                        >
                            <MenuItem value={DurationUnit.Days}>Days</MenuItem>
                            <MenuItem value={DurationUnit.Weeks}>Weeks</MenuItem>
                        </StyledTextField>
                        {MUTE_DURATION_PRESETS_DAYS.map((days) => (
                            <Chip key={days} label={formatPreset(days)} variant="outlined" size="small" sx={styles.chip} onClick={() => applyPreset(days)} />
                        ))}
                    </>
                )}
            </Box>

            {definition.requiresNewUsername && (
                <Box sx={styles.row}>
                    <StyledTextField
                        placeholder="New username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        size="small"
                        errorMessage={newUsernameError ?? ''}
                    />
                </Box>
            )}

            {definition.supportsUsernameReset && (
                <FormControlLabel
                    sx={styles.checkboxLabel}
                    control={(
                        <Checkbox checked={resetUsername} onChange={(e) => setResetUsername(e.target.checked)} size="small" sx={styles.checkbox} />
                    )}
                    label={`Also reset username to ${RESET_USERNAME_PREFIX}XXXX (random number)`}
                />
            )}

            {unavailableReason
                ? <Typography sx={styles.unavailableText}>{unavailableReason}</Typography>
                : MOD_ACTION_HELP_TEXT[actionType] && <Typography sx={styles.helpText}>{MOD_ACTION_HELP_TEXT[actionType]}</Typography>}

            {templates.length > 0 && (
                <Box sx={styles.chipRow}>
                    {templates.map((template) => (
                        <Chip key={template} label={template} variant="outlined" size="small" sx={styles.chip} onClick={() => applyTemplate(template)} />
                    ))}
                </Box>
            )}
            <StyledTextField
                multiline
                minRows={2}
                fullWidth
                size="small"
                placeholder={definition.requiresNote ? 'Note about the action (required)' : 'Note about the action (optional)'}
                value={note}
                errorMessage={showNoteError ? 'A note is required for this action' : ''}
                onChange={(e) => {
                    setNote(e.target.value);
                    setShowNoteError(false);
                }}
            />

            <Box sx={styles.footer}>
                <Box>{extraOptions}</Box>
                <PreferenceButton
                    variant="concede"
                    text={submitting ? 'Applying…' : definition.label}
                    disabled={!canSubmit}
                    buttonFnc={handleSubmitClick}
                />
            </Box>

            <ConfirmationDialog
                open={confirmOpen}
                title="Mod Action"
                message={`This will ${description}.${confirmationSuffix ? ` ${confirmationSuffix}` : ''} Are you sure?`}
                confirmButtonText="Confirm Action"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                zIndex={confirmationZIndex}
            />
        </Box>
    );
};

export default ModActionForm;
