import React, { useState } from 'react';
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import ModActionForm from '@/app/_components/_sharedcomponents/ModActions/ModActionForm';
import { IModActionRequest, IModActionResult, modActionTargetFromReportContext } from '@/app/_utils/modActionSubmission';
import { finishReportActionAsync } from '@/app/_utils/reportActionSubmission';
import { IReportActionPanelProps } from './reportTypes';

/** Above the report detail dialog */
const CONFIRMATION_Z_INDEX = 1500;

/**
 * Mod actions against the selected player of a report, with the same form as the player view. Most tickets are
 * resolved by a single action, so the ticket is closed with it unless the moderator keeps it open, e.g. to also
 * act against the other player.
 */
const ReportActionPanel: React.FC<IReportActionPanelProps> = ({ reportId, target, onActionApplied, onTicketClosed, onError }) => {
    const [closeTicket, setCloseTicket] = useState(true);

    const handleSubmitted = async (result: IModActionResult, request: IModActionRequest) => {
        const outcome = await finishReportActionAsync(reportId, result, request.note, closeTicket);
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
        checkboxLabel: {
            color: 'white',
            '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
        },
        checkbox: {
            color: '#B0B0B0',
            '&.Mui-checked': { color: '#2F7DB6' },
        },
    };

    return (
        <Box>
            <Typography sx={styles.title}>Take Action Against {target.username}</Typography>
            <ModActionForm
                target={modActionTargetFromReportContext(target)}
                reportId={reportId}
                confirmationZIndex={CONFIRMATION_Z_INDEX}
                confirmationSuffix={closeTicket ? 'The ticket will be closed as Action Taken.' : 'The ticket stays open.'}
                extraOptions={(
                    <FormControlLabel
                        sx={styles.checkboxLabel}
                        control={<Checkbox checked={closeTicket} onChange={(e) => setCloseTicket(e.target.checked)} size="small" sx={styles.checkbox} />}
                        label="Close the ticket afterwards"
                    />
                )}
                onSubmitted={handleSubmitted}
                onError={onError}
            />
        </Box>
    );
};

export default ReportActionPanel;
