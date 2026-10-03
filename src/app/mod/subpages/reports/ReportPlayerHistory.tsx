import React, { useMemo } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import {
    IModActionResponse,
    IPlayerSearchResult,
    PlayerReportRole,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { formatDate, getActionLabel, getActionStatus } from '@/app/_utils/ModerationUtils';
import { describeModAction, getOffenseLabel, getOutcomeOption } from '@/app/_utils/playerReportUtils';
import { IReportPlayerHistoryProps } from './reportTypes';

const ACTION_RESULT_COLOR = '#ef5350';

interface IHistoryRow {
    key: string;
    createdAt: string;
    label: string;
    status: { label: string; color: string };

    /** Lines shown when hovering the row */
    details: string[];
    isCurrentTicket: boolean;
}

const describeActionInDetail = (action: IModActionResponse, statusLabel: string): string => {
    const parts = [`${describeModAction(action)}${statusLabel ? ` (${statusLabel})` : ''} by ${action.moderatorUsername} on ${formatDate(action.createdAt)}`];
    if (action.note) {
        parts.push(`"${action.note}"`);
    }
    return parts.join(' – ');
};

/**
 * Reports and mod actions of one player, newest first, one row per report ticket: actions issued
 * from a ticket are folded into that ticket's row. Hovering a row shows the details.
 */
const ReportPlayerHistory: React.FC<IReportPlayerHistoryProps> = ({ context, currentReportId }) => {
    const rows = useMemo<IHistoryRow[]>(() => {
        // getActionStatus only reads the active rename from the player
        const playerForStatus: IPlayerSearchResult = {
            id: context.playerId,
            username: context.username,
            createdAt: context.createdAt ?? '',
            lastLogin: '',
            isMuted: context.isMuted,
            activeRename: context.activeRename ?? undefined,
        };

        const reportIds = new Set([...context.reportsAgainst, ...context.reportsFiled].map((entry) => entry.reportId));
        const isFoldedIntoTicket = (action: IModActionResponse) => !!action.relatedReportId && reportIds.has(action.relatedReportId);

        // Only actions issued outside a ticket (e.g. from Find User) get a row of their own
        const actionRows: IHistoryRow[] = context.modActions.filter((action) => !isFoldedIntoTicket(action)).map((action) => {
            const details = [`Moderator: ${action.moderatorUsername}`];
            if (action.note) {
                details.push(`Note: ${action.note}`);
            }
            if (action.startedAt) {
                details.push(`Started: ${formatDate(action.startedAt)}`);
            }
            if (action.expiresAt) {
                details.push(`Expires: ${formatDate(action.expiresAt)}`);
            }
            if (action.cancelledAt) {
                details.push(`Cancelled by ${action.cancelledByUsername} on ${formatDate(action.cancelledAt)}`);
            }
            if (action.relatedReportId) {
                details.push(action.relatedReportId === currentReportId ? 'Issued from this ticket' : 'Issued from another report ticket');
            }

            return {
                key: `action-${action.id}`,
                createdAt: action.createdAt,
                label: getActionLabel(action),
                status: getActionStatus(action, playerForStatus),
                details,
                isCurrentTicket: action.relatedReportId === currentReportId,
            };
        });

        const reportRows: IHistoryRow[] = [...context.reportsAgainst, ...context.reportsFiled].map((entry) => {
            const outcome = getOutcomeOption(entry.outcome);
            const isReported = entry.role === PlayerReportRole.Reported;
            const actionsFromTicket = context.modActions.filter((action) => action.relatedReportId === entry.reportId);

            let status: { label: string; color: string };
            if (actionsFromTicket.length > 0) {
                status = { label: actionsFromTicket.map(describeModAction).join(', '), color: ACTION_RESULT_COLOR };
            } else if (entry.status === PlayerReportStatus.Open) {
                status = { label: 'Open', color: '#64b5f6' };
            } else {
                status = { label: outcome?.label ?? 'Closed', color: outcome?.color ?? '#9E9E9E' };
            }

            const details = [
                isReported ? `${context.username} was reported for ${getOffenseLabel(entry.offense)}` : `${context.username} reported someone for ${getOffenseLabel(entry.offense)}`,
                entry.status === PlayerReportStatus.Open ? 'Ticket open' : `Ticket closed: ${outcome?.label ?? entry.outcome ?? 'unknown'}`,
                ...(actionsFromTicket.length > 0
                    ? actionsFromTicket.map((action) => describeActionInDetail(action, getActionStatus(action, playerForStatus).label))
                    : [`No mod action against ${context.username} in this ticket`]),
            ];

            return {
                key: `report-${entry.role}-${entry.reportId}`,
                createdAt: entry.createdAt,
                label: `${formatDate(entry.createdAt)} ${isReported ? 'Reported for' : 'Filed report:'} ${getOffenseLabel(entry.offense)}`,
                status,
                details,
                isCurrentTicket: entry.reportId === currentReportId,
            };
        });

        return [...actionRows, ...reportRows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, [context, currentReportId]);

    // ----------------Styles----------------//
    const styles = {
        title: {
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: '0.5rem',
        },
        list: {
            maxHeight: '320px',
            overflowY: 'auto' as const,
            '::-webkit-scrollbar': { width: '0.2vw' },
            '::-webkit-scrollbar-thumb': { backgroundColor: '#D3D3D3B3', borderRadius: '1vw' },
            '::-webkit-scrollbar-button': { display: 'none' },
        },
        row: (isCurrentTicket: boolean) => ({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '0.5rem',
            padding: '0.4rem 0.5rem',
            borderBottom: '1px solid rgba(74, 85, 104, 0.5)',
            backgroundColor: isCurrentTicket ? 'rgba(47, 125, 182, 0.12)' : 'transparent',
            cursor: 'default',
            '&:hover': { backgroundColor: 'rgba(47, 125, 182, 0.2)' },
        }),
        label: {
            color: '#ffd54f',
            fontSize: '0.8rem',
            mb: 0,
        },
        status: (color: string) => ({
            color,
            fontSize: '0.75rem',
            fontWeight: 600,
            textAlign: 'right' as const,
            mb: 0,
        }),
        thisTicket: {
            color: '#64b5f6',
            fontSize: '0.7rem',
            ml: '0.4rem',
        },
        tooltipLine: {
            fontSize: '0.75rem',
            mb: '0.15rem',
        },
        empty: {
            color: '#9e9e9e',
            fontSize: '0.8rem',
        },
    };

    return (
        <Box>
            <Typography sx={styles.title}>History of {context.username}</Typography>
            {rows.length === 0 ? (
                <Typography sx={styles.empty}>No earlier reports or mod actions.</Typography>
            ) : (
                <Box sx={styles.list}>
                    {rows.map((row) => (
                        <Tooltip
                            key={row.key}
                            placement="left"
                            title={(
                                <Box>
                                    {row.details.map((line) => (
                                        <Typography key={line} sx={styles.tooltipLine}>{line}</Typography>
                                    ))}
                                </Box>
                            )}
                        >
                            <Box sx={styles.row(row.isCurrentTicket)}>
                                <Typography sx={styles.label}>
                                    {row.label}
                                    {row.isCurrentTicket && <Box component="span" sx={styles.thisTicket}>this ticket</Box>}
                                </Typography>
                                {row.status.label && <Typography sx={styles.status(row.status.color)}>{row.status.label}</Typography>}
                            </Box>
                        </Tooltip>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default ReportPlayerHistory;
