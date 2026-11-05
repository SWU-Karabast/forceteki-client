import React, { useState } from 'react';
import { Box, Checkbox, FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material';
import ModActionForm from '@/app/_components/_sharedcomponents/ModActions/ModActionForm';
import { PlayerReportOutcome } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { IModActionRequest, IModActionResult, modActionTargetFromReportContext } from '@/app/_utils/modActionSubmission';
import { ACTION_CLOSE_OUTCOMES, finishReportActionAsync } from '@/app/_utils/reportActionSubmission';
import { getOutcomeOption } from '@/app/_utils/playerReportUtils';
import { IReportActionPanelProps } from './reportTypes';
import OutcomeLabel from './OutcomeLabel';

/** Above the report detail dialog */
const CONFIRMATION_Z_INDEX = 1500;

/**
 * Mod actions against the selected player of a report, with the same form as the player view. Most tickets are
 * resolved by a single action, so the ticket is closed with it unless the moderator keeps it open, e.g. to also
 * act against the other player. It closes as Action Taken unless the moderator picks False Report.
 */
const ReportActionPanel: React.FC<IReportActionPanelProps> = ({ reportId, target, onActionApplied, onTicketClosed, onError }) => {
    const [closeTicket, setCloseTicket] = useState(true);
    const [closeOutcome, setCloseOutcome] = useState<PlayerReportOutcome>(PlayerReportOutcome.ActionTaken);
    const closeOutcomeLabel = getOutcomeOption(closeOutcome)?.label ?? closeOutcome;

    const handleSubmitted = async (result: IModActionResult, request: IModActionRequest) => {
        const outcome = await finishReportActionAsync(reportId, result, request.note, closeTicket, closeOutcome);
        if (!outcome.actionApplied) {
            onError(outcome.message);
        } else if (outcome.ticketClosed) {
            onTicketClosed(outcome.message, outcome.isWarning);
        } else {
            await onActionApplied(outcome.message, outcome.isWarning);
        }
    };

    // ----------------Styles----------------//
    const styles = {
        title: {
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: '0.5rem',
        },
        closeOptions: {
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            columnGap: '0.75rem',
        },
        checkboxLabel: {
            color: 'white',
            mr: 0,
            '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
        },
        checkbox: {
            color: '#B0B0B0',
            '&.Mui-checked': { color: '#2F7DB6' },
        },
        radio: {
            color: '#fff',
            p: '0.25rem',
            '&.Mui-checked': { color: '#fff' },
        },
        radioLabel: {
            mr: '0.75rem',
        },
    };

    return (
        <Box>
            <Typography sx={styles.title}>Take Action Against {target.username}</Typography>
            <ModActionForm
                target={modActionTargetFromReportContext(target)}
                reportId={reportId}
                confirmationZIndex={CONFIRMATION_Z_INDEX}
                confirmationSuffix={closeTicket ? `The ticket will be closed as ${closeOutcomeLabel}.` : 'The ticket stays open.'}
                extraOptions={(
                    <Box sx={styles.closeOptions}>
                        <FormControlLabel
                            sx={styles.checkboxLabel}
                            control={<Checkbox checked={closeTicket} onChange={(e) => setCloseTicket(e.target.checked)} size="small" sx={styles.checkbox} />}
                            label={closeTicket ? 'Close the ticket as' : 'Close the ticket afterwards'}
                        />
                        {closeTicket && (
                            <RadioGroup row value={closeOutcome} onChange={(e) => setCloseOutcome(e.target.value as PlayerReportOutcome)}>
                                {ACTION_CLOSE_OUTCOMES.map((value) => {
                                    const option = getOutcomeOption(value);
                                    return option && (
                                        <FormControlLabel
                                            key={value}
                                            value={value}
                                            sx={styles.radioLabel}
                                            control={<Radio size="small" sx={styles.radio} />}
                                            label={<OutcomeLabel option={option} />}
                                        />
                                    );
                                })}
                            </RadioGroup>
                        )}
                    </Box>
                )}
                onSubmitted={handleSubmitted}
                onError={onError}
            />
        </Box>
    );
};

export default ReportActionPanel;
