import React, { useState } from 'react';
import { Box, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import {
    PlayerReportOutcome,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { formatDate } from '@/app/_utils/ModerationUtils';
import { getOutcomeOption, REPORT_OUTCOME_OPTIONS } from '@/app/_utils/playerReportUtils';
import { IReportClosePanelProps } from './reportTypes';

/**
 * Closing a ticket records how it was resolved. Closed tickets show that outcome and can be reopened.
 */
const ReportClosePanel: React.FC<IReportClosePanelProps> = ({ report, onClosed, onReopened, onError }) => {
    const [outcome, setOutcome] = useState<PlayerReportOutcome | ''>('');
    const [closingNote, setClosingNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const runAsync = async (operation: () => Promise<void>) => {
        setSubmitting(true);
        try {
            await operation();
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Request failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => runAsync(async () => {
        if (!outcome) {
            return;
        }
        const result = await ServerApiService.closePlayerReportAsync(report.id, outcome, closingNote.trim() || undefined);
        if (result.success) {
            onClosed();
        } else {
            onError(result.message ?? 'Failed to close ticket');
        }
    });

    const handleReopen = () => runAsync(async () => {
        const result = await ServerApiService.reopenPlayerReportAsync(report.id);
        if (result.success) {
            onReopened();
        } else {
            onError(result.message ?? 'Failed to reopen ticket');
        }
    });

    // ----------------Styles----------------//
    const styles = {
        title: {
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: '0.25rem',
        },
        radioGroup: {
            mb: '0.5rem',
        },
        radio: {
            color: '#fff',
            '&.Mui-checked': { color: '#fff' },
        },
        radioLabel: (color: string) => ({
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color,
            fontSize: '0.875rem',
            fontWeight: 600,
        }),
        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            mt: '0.75rem',
        },
        closedSummary: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '0.25rem',
        },
        summaryText: {
            color: '#B0B0B0',
            fontSize: '0.85rem',
            mb: 0,
        },
    };

    if (report.status === PlayerReportStatus.Closed) {
        const closedOutcome = getOutcomeOption(report.outcome);
        return (
            <Box sx={styles.closedSummary}>
                <Typography sx={styles.title}>Ticket closed</Typography>
                <Typography sx={{ ...styles.summaryText, color: closedOutcome?.color ?? 'white', fontWeight: 600 }}>
                    {closedOutcome?.label ?? report.outcome}
                </Typography>
                <Typography sx={styles.summaryText}>
                    by {report.closedByUsername}{report.closedAt ? ` on ${formatDate(report.closedAt)}` : ''}
                </Typography>
                {report.closingNote && <Typography sx={styles.summaryText}>Note: {report.closingNote}</Typography>}
                <Box sx={styles.footer}>
                    <PreferenceButton variant="standard" text="Reopen ticket" disabled={submitting} buttonFnc={handleReopen} />
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Typography sx={styles.title}>Close ticket</Typography>
            <RadioGroup row value={outcome} onChange={(e) => setOutcome(e.target.value as PlayerReportOutcome)} sx={styles.radioGroup}>
                {REPORT_OUTCOME_OPTIONS.map((option) => (
                    <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio size="small" sx={styles.radio} />}
                        label={(
                            <Box component="span" sx={styles.radioLabel(option.color)}>
                                {option.label}
                            </Box>
                        )}
                    />
                ))}
            </RadioGroup>
            <StyledTextField
                fullWidth
                placeholder="Closing note (optional)"
                value={closingNote}
                onChange={(e) => setClosingNote(e.target.value)}
            />
            <Box sx={styles.footer}>
                <PreferenceButton
                    variant="concede"
                    text={submitting ? 'Closing…' : 'Close ticket'}
                    disabled={!outcome || submitting}
                    buttonFnc={handleClose}
                />
            </Box>
        </Box>
    );
};

export default ReportClosePanel;
