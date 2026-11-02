import React, { useEffect, useState } from 'react';
import { Box, Checkbox, Dialog, FormControlLabel, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { IPlayerReport, modActionDefinitions, ModActionType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { describeModActionRequest, submitModActionAsync } from '@/app/_utils/modActionSubmission';
import { finishReportActionAsync, getQuickActionNote, IReportActionOutcome, QUICK_MUTE_DAYS } from '@/app/_utils/reportActionSubmission';
import { getOffenseLabel } from '@/app/_utils/playerReportUtils';

export type ReportQuickAction = ModActionType.Warning | ModActionType.Mute;

export const REPORT_QUICK_ACTION_LABELS: Record<ReportQuickAction, string> = {
    [ModActionType.Warning]: 'Warning',
    [ModActionType.Mute]: `Mute ${QUICK_MUTE_DAYS / 7} Week`,
};

interface IReportQuickActionDialogProps {

    /** The report and the action to take against its reported player; null while closed */
    request: { report: IPlayerReport; actionType: ReportQuickAction } | null;
    onCancel: () => void;
    onDone: (outcome: IReportActionOutcome) => void;
}

/**
 * A Warning or a one-week Mute against the reported player, straight from the report list. The note starts from
 * what the player was reported for, and the ticket is closed as Action Taken unless the moderator unticks it.
 */
const ReportQuickActionDialog: React.FC<IReportQuickActionDialogProps> = ({ request, onCancel, onDone }) => {
    const [note, setNote] = useState('');
    const [closeTicket, setCloseTicket] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (request) {
            setNote(getQuickActionNote(request.actionType, request.report.offense));
            setCloseTicket(true);
        }
    }, [request]);

    if (!request) {
        return null;
    }

    const { report, actionType } = request;
    const durationDays = actionType === ModActionType.Mute ? QUICK_MUTE_DAYS : undefined;
    const noteMissing = modActionDefinitions[actionType].requiresNote && !note.trim();

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const result = await submitModActionAsync({
                playerId: report.reportedPlayerId,
                currentUsername: report.reportedPlayerUsername,
                actionType,
                note: note.trim(),
                durationDays,
                reportId: report.id,
            });
            onDone(await finishReportActionAsync(report.id, result, note.trim(), closeTicket));
        } catch (error) {
            onDone({ actionApplied: false, ticketClosed: false, isWarning: true, message: error instanceof Error ? error.message : 'Failed to submit the action' });
        } finally {
            setSubmitting(false);
        }
    };

    // ----------------Styles----------------//
    const styles = {
        paper: {
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            border: '2px solid transparent',
            borderRadius: '15px',
            color: 'white',
            padding: '1.25rem',
            width: '520px',
        },
        title: {
            fontSize: '1.1rem',
            fontWeight: 700,
            mb: '0.25rem',
        },
        subtitle: {
            color: '#B0B0B0',
            fontSize: '0.85rem',
            mb: '1rem',
        },
        checkboxLabel: {
            color: 'white',
            mt: '0.5rem',
            '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
        },
        checkbox: {
            color: '#B0B0B0',
            '&.Mui-checked': { color: '#2F7DB6' },
        },
        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            mt: '1rem',
        },
    };

    return (
        <Dialog open onClose={submitting ? undefined : onCancel} PaperProps={{ sx: styles.paper }}>
            <Typography sx={styles.title}>{REPORT_QUICK_ACTION_LABELS[actionType]}: {report.reportedPlayerUsername}</Typography>
            <Typography sx={styles.subtitle}>
                Reported by {report.reporterUsername} for {getOffenseLabel(report.offense)}. This will {describeModActionRequest(actionType, report.reportedPlayerUsername, { durationDays })}.
            </Typography>
            <StyledTextField
                multiline
                minRows={2}
                size="small"
                placeholder="Note about the action (required)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
            <FormControlLabel
                sx={styles.checkboxLabel}
                control={<Checkbox checked={closeTicket} onChange={(e) => setCloseTicket(e.target.checked)} size="small" sx={styles.checkbox} />}
                label="Close the ticket as Action Taken"
            />
            <Box sx={styles.footer}>
                <PreferenceButton variant="standard" text="Cancel" buttonFnc={onCancel} disabled={submitting} />
                <PreferenceButton
                    variant="concede"
                    text={submitting ? 'Applying…' : REPORT_QUICK_ACTION_LABELS[actionType]}
                    buttonFnc={handleConfirm}
                    disabled={submitting || noteMissing}
                />
            </Box>
        </Dialog>
    );
};

export default ReportQuickActionDialog;
