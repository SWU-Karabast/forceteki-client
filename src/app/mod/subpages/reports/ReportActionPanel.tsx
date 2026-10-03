import React, { useState } from 'react';
import { Box, Chip, MenuItem, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import { ServerApiService } from '@/app/_services/ServerApiService';
import {
    IReportQuickAction,
    ONE_WEEK_IN_DAYS,
    REPORT_COMMENT_TEMPLATES,
    REPORT_QUICK_ACTIONS,
    ReportQuickActionKey,
} from '@/app/_utils/playerReportUtils';
import NotImplementedCog from './NotImplementedCog';
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
const ReportActionPanel: React.FC<IReportActionPanelProps> = ({ reportId, targetPlayerId, targetUsername, targetIsAnonymous, onActionApplied, onError }) => {
    const [selectedAction, setSelectedAction] = useState<IReportQuickAction | null>(null);
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
    const canApply = !!selectedAction && !submitting && !targetIsAnonymous && (!needsDuration || getDurationDays() > 0);

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
            default:
                return selectedAction.label;
        }
    };

    const handleApplyClick = () => {
        if (!comment.trim()) {
            setShowCommentError(true);
            return;
        }
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setConfirmOpen(false);
        if (!selectedAction?.actionType) {
            return;
        }

        setSubmitting(true);
        try {
            const result = await ServerApiService.submitModActionAsync(
                targetPlayerId,
                selectedAction.actionType,
                comment.trim(),
                isMute ? getDurationDays() : undefined,
                reportId,
            );
            if (result.success) {
                onActionApplied(result.message);
                setSelectedAction(null);
                setDurationValue('');
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
        buttonLabel: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
        },
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
                {REPORT_QUICK_ACTIONS.map((action) => (
                    <PreferenceButton
                        key={action.key}
                        variant="standard"
                        disabled={action.notImplemented || submitting || targetIsAnonymous}
                        sx={styles.actionButton(selectedAction?.key === action.key)}
                        buttonFnc={() => setSelectedAction(action)}
                        text={(
                            <Box component="span" sx={styles.buttonLabel}>
                                {action.notImplemented && <NotImplementedCog />}
                                {action.label}
                            </Box>
                        )}
                    />
                ))}
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
