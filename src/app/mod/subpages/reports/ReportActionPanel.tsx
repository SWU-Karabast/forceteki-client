import React, { useState } from 'react';
import { Box, Checkbox, Chip, FormControlLabel, MenuItem, Tooltip, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import {
    modActionDefinitions,
    RESET_USERNAME_PREFIX,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { getNewUsernameError, MOD_ACTION_HELP_TEXT, pickResetUsername, submitModActionAsync } from '@/app/_utils/modActionSubmission';
import {
    getQuickActionUnavailableReason,
    IReportQuickAction,
    ONE_WEEK_IN_DAYS,
    REPORT_COMMENT_TEMPLATES,
    REPORT_QUICK_ACTIONS,
    ReportQuickActionKey,
} from '@/app/_utils/playerReportUtils';
import { IReportActionPanelProps } from './reportTypes';

enum DurationUnit {
    Days = 'Days',
    Weeks = 'Weeks',
}

/** Above the report detail dialog */
const CONFIRMATION_Z_INDEX = 1500;

/**
 * Quick actions against the selected player of a report. Issuing an action links it to the
 * ticket but leaves the ticket open, so several players can be handled in one report.
 */
const ReportActionPanel: React.FC<IReportActionPanelProps> = ({ reportId, target, onActionApplied, onError }) => {
    const targetUsername = target.username;
    // Players without a profile were playing anonymously
    const targetIsAnonymous = !target.createdAt;

    const [selectedAction, setSelectedAction] = useState<IReportQuickAction | null>(null);
    const [newUsername, setNewUsername] = useState('');
    const [resetUsername, setResetUsername] = useState(false);
    const [resetName, setResetName] = useState<string | undefined>(undefined);
    const [durationValue, setDurationValue] = useState('');
    const [durationUnit, setDurationUnit] = useState<DurationUnit>(DurationUnit.Days);
    const [comment, setComment] = useState('');
    const [showCommentError, setShowCommentError] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const getDurationDays = (): number => {
        if (!selectedAction) {
            return 0;
        }
        if (selectedAction.key !== ReportQuickActionKey.MuteCustom) {
            return selectedAction.durationDays ?? 0;
        }
        const value = parseInt(durationValue);
        if (!value || value <= 0) {
            return 0;
        }
        return durationUnit === DurationUnit.Weeks ? value * ONE_WEEK_IN_DAYS : value;
    };

    const needsDuration = selectedAction?.key === ReportQuickActionKey.MuteCustom;
    const isMute = selectedAction?.key === ReportQuickActionKey.MuteOneWeek || needsDuration;
    const definition = selectedAction ? modActionDefinitions[selectedAction.actionType] : null;
    const needsNewUsername = !!definition?.requiresNewUsername;
    const newUsernameError = needsNewUsername ? getNewUsernameError(newUsername, targetUsername) : null;
    const unavailableReason = selectedAction ? getQuickActionUnavailableReason(selectedAction, target) : null;
    const canApply = !!selectedAction
        && !submitting
        && !targetIsAnonymous
        && !unavailableReason
        && (!needsDuration || getDurationDays() > 0)
        && (!needsNewUsername || (!!newUsername.trim() && !newUsernameError));

    const selectAction = (action: IReportQuickAction) => {
        setSelectedAction(action);
        setNewUsername('');
        setResetUsername(false);
    };

    const describeAction = (): string => {
        if (!selectedAction) {
            return '';
        }
        switch (selectedAction.key) {
            case ReportQuickActionKey.MuteOneWeek:
            case ReportQuickActionKey.MuteCustom:
                return `mute ${targetUsername} for ${getDurationDays()} day${getDurationDays() === 1 ? '' : 's'}`;
            case ReportQuickActionKey.Warning:
                return `issue a warning to ${targetUsername}`;
            case ReportQuickActionKey.ForceRename:
                return `force ${targetUsername} to rename`;
            case ReportQuickActionKey.DisableReporting:
                return `disable reporting for ${targetUsername}`;
            case ReportQuickActionKey.BlockUsernameChanges:
                return `block ${targetUsername} from changing their username${resetName ? ` and reset it to ${resetName}` : ''}`;
            case ReportQuickActionKey.ChangeUsername:
                return `change the username of ${targetUsername} to ${newUsername.trim()}`;
            default:
                return selectedAction.label;
        }
    };

    const handleApplyClick = () => {
        if (!comment.trim()) {
            setShowCommentError(true);
            return;
        }
        // Decided before confirming so the dialog can name the new username
        setResetName(selectedAction ? pickResetUsername(selectedAction.actionType, resetUsername, targetUsername) : undefined);
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setConfirmOpen(false);
        if (!selectedAction) {
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitModActionAsync({
                playerId: target.playerId,
                currentUsername: targetUsername,
                actionType: selectedAction.actionType,
                note: comment.trim(),
                durationDays: isMute ? getDurationDays() : undefined,
                newUsername,
                resetRequested: resetUsername,
                resetName,
                reportId,
            });
            if (result.mainActionApplied) {
                // A failed follow-up (the username reset) is reported as a warning, but the action itself
                // is in place, so the ticket has to be refreshed and the form cleared all the same
                onActionApplied(result.message, !result.success);
                setSelectedAction(null);
                setDurationValue('');
                setNewUsername('');
                setResetUsername(false);
                setComment('');
            } else {
                onError(result.message);
            }
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Failed to apply action');
        } finally {
            setSubmitting(false);
        }
    };

    const applyTemplate = (template: string) => {
        setComment((current) => (current.trim() ? `${current.trim()} ${template}` : template));
        setShowCommentError(false);
    };

    // ----------------Styles----------------//
    const styles = {
        title: {
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: '0.5rem',
        },
        actionRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.5rem',
            mb: '0.75rem',
        },
        actionButton: (isSelected: boolean) => ({
            minWidth: '130px',
            fontSize: '0.875rem',
            ...(isSelected ? {
                backgroundColor: 'rgba(47, 125, 182, 0.6)',
                '&:hover': { backgroundColor: 'rgba(47, 125, 182, 0.75)' },
            } : {}),
        }),
        durationRow: {
            display: 'flex',
            gap: '0.75rem',
            mb: '0.75rem',
        },
        durationField: {
            width: '140px',
            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none' },
        },
        templateRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.4rem',
            mb: '0.5rem',
        },
        templateChip: {
            color: '#B0B0B0',
            borderColor: '#4A5568',
            fontSize: '0.75rem',
            '&:hover': { color: 'white', borderColor: '#2F7DB6' },
        },
        resetOption: {
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
        anonymousNote: {
            color: '#ffb74d',
            fontSize: '0.8rem',
            mb: '0.5rem',
        },
        submitRow: {
            display: 'flex',
            justifyContent: 'flex-end',
            mt: '0.75rem',
        },
    };

    return (
        <Box>
            <Typography sx={styles.title}>Quick actions for {targetUsername}</Typography>
            {targetIsAnonymous && (
                <Typography sx={styles.anonymousNote}>
                    {targetUsername} is playing without an account, so mod actions cannot be issued against them.
                </Typography>
            )}
            <Box sx={styles.actionRow}>
                {REPORT_QUICK_ACTIONS.map((action) => {
                    const reason = getQuickActionUnavailableReason(action, target);
                    return (
                        <Tooltip key={action.key} title={reason ?? ''}>
                            {/* The wrapper keeps the tooltip working on a disabled button */}
                            <span>
                                <PreferenceButton
                                    variant="standard"
                                    disabled={submitting || targetIsAnonymous || !!reason}
                                    sx={styles.actionButton(selectedAction?.key === action.key)}
                                    buttonFnc={() => selectAction(action)}
                                    text={action.label}
                                />
                            </span>
                        </Tooltip>
                    );
                })}
            </Box>

            {needsDuration && (
                <Box sx={styles.durationRow}>
                    <StyledTextField
                        type="number"
                        placeholder="Duration"
                        value={durationValue}
                        onChange={(e) => setDurationValue(e.target.value)}
                        sx={styles.durationField}
                    />
                    <StyledTextField
                        select
                        value={durationUnit}
                        onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                        sx={styles.durationField}
                    >
                        <MenuItem value={DurationUnit.Days}>Days</MenuItem>
                        <MenuItem value={DurationUnit.Weeks}>Weeks</MenuItem>
                    </StyledTextField>
                </Box>
            )}

            {needsNewUsername && (
                <Box sx={styles.durationRow}>
                    <StyledTextField
                        placeholder="New username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        errorMessage={newUsernameError ?? ''}
                    />
                </Box>
            )}

            {definition?.supportsUsernameReset && (
                <FormControlLabel
                    sx={styles.resetOption}
                    control={(
                        <Checkbox
                            checked={resetUsername}
                            onChange={(e) => setResetUsername(e.target.checked)}
                            size="small"
                            sx={styles.checkbox}
                        />
                    )}
                    label={`Also reset username to ${RESET_USERNAME_PREFIX}XXXX (random number)`}
                />
            )}

            {selectedAction && MOD_ACTION_HELP_TEXT[selectedAction.actionType] && (
                <Typography sx={styles.helpText}>{MOD_ACTION_HELP_TEXT[selectedAction.actionType]}</Typography>
            )}

            <Box sx={styles.templateRow}>
                {REPORT_COMMENT_TEMPLATES.map((template) => (
                    <Chip key={template} label={template} variant="outlined" size="small" sx={styles.templateChip} onClick={() => applyTemplate(template)} />
                ))}
            </Box>
            <StyledTextField
                multiline
                minRows={2}
                fullWidth
                placeholder="Describe the case (required)"
                value={comment}
                error={showCommentError}
                helperText={showCommentError ? 'A comment is required' : undefined}
                onChange={(e) => {
                    setComment(e.target.value);
                    setShowCommentError(false);
                }}
            />

            <Box sx={styles.submitRow}>
                <PreferenceButton
                    variant="standard"
                    text={submitting ? 'Applying…' : selectedAction ? `Apply: ${selectedAction.label}` : 'Select an action'}
                    disabled={!canApply}
                    buttonFnc={handleApplyClick}
                />
            </Box>

            <ConfirmationDialog
                open={confirmOpen}
                title="Mod Action"
                message={`This will ${describeAction()}. The ticket stays open. Continue?`}
                confirmButtonText="Confirm Action"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                zIndex={CONFIRMATION_Z_INDEX}
            />
        </Box>
    );
};

export default ReportActionPanel;
