import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import {
    IPlayerReportPlayerContext,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { buildUserHistory, formatDate, getModActionEntryLabel, getUsernameChangeLabel } from '@/app/_utils/ModerationUtils';
import {
    formatAccountAge,
    formatTimeAgoPhrase,
    getOffenseLabel,
    getOutcomeOption,
    MODERATION_STANDING_STYLES,
    OPEN_TICKET_COLOR,
    playerFromReportContext,
} from '@/app/_utils/playerReportUtils';

/** Newest history entries and reports listed; the full lists are in the history column and in Find User */
const MAX_HISTORY_SHOWN = 5;
const MAX_REPORTS_SHOWN = 3;

interface IPlayerProfileTooltipProps {
    context: IPlayerReportPlayerContext;
    children: React.ReactElement;
}

/**
 * The player's profile as Find User shows it, in short, when hovering their name on a report ticket: account
 * dates and ID, active restrictions, recent history and reports, and other accounts with the same name.
 */
const PlayerProfileTooltip: React.FC<IPlayerProfileTooltipProps> = ({ context, children }) => {
    const dateFormat = useDateFormat();
    const standing = MODERATION_STANDING_STYLES[context.standing];
    const player = playerFromReportContext(context);
    const history = buildUserHistory(context.modActions, context.usernameChanges);

    const activeRestrictions = [
        context.isMuted && 'Muted',
        context.activeRename && 'Pending force rename',
        context.activeReportingDisabledId && 'Reporting disabled',
        context.activeUsernameChangesBlockedId && 'Username changes blocked',
    ].filter((label): label is string => !!label);

    // ----------------Styles----------------//
    const styles = {
        tooltip: {
            maxWidth: '420px',
            backgroundColor: '#0F1F27',
            border: '1px solid #4A5568',
            padding: '0.6rem 0.75rem',
        },
        name: {
            color: standing.color,
            fontSize: '0.9rem',
            fontWeight: 700,
            mb: 0,
        },
        standing: {
            color: standing.color,
            fontSize: '0.7rem',
            mb: '0.4rem',
        },
        section: {
            color: '#9e9e9e',
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
            mt: '0.5rem',
            mb: '0.1rem',
        },
        line: {
            color: '#E0E0E0',
            fontSize: '0.75rem',
            mb: 0,
            wordBreak: 'break-word' as const,
        },
        muted: {
            color: '#9e9e9e',
            fontSize: '0.75rem',
            mb: 0,
        },
        restriction: {
            color: '#ef9a9a',
            fontSize: '0.75rem',
            fontWeight: 600,
            mb: 0,
        },
    };

    const renderAccount = () => (
        <>
            <Typography sx={styles.line}>Player ID: {context.playerId}</Typography>
            {context.createdAt ? (
                <>
                    <Typography sx={styles.line}>
                        Created: {formatDate(context.createdAt, dateFormat)} ({formatAccountAge(context.createdAt)} old)
                    </Typography>
                    {context.lastLogin && (
                        <Typography sx={styles.line}>
                            Last login: {formatDate(context.lastLogin, dateFormat)} ({formatTimeAgoPhrase(context.lastLogin)})
                        </Typography>
                    )}
                </>
            ) : (
                <Typography sx={styles.muted}>Playing without an account</Typography>
            )}
        </>
    );

    const renderHistory = () => {
        if (history.length === 0) {
            return <Typography sx={styles.muted}>No history</Typography>;
        }
        return (
            <>
                {history.slice(0, MAX_HISTORY_SHOWN).map((entry) => (
                    <Typography key={entry.id} sx={styles.line}>
                        {entry.kind === 'modAction'
                            ? getModActionEntryLabel(entry, player, dateFormat)
                            : getUsernameChangeLabel(entry.usernameChange!, dateFormat)}
                        {entry.modAction?.cancelledAt && <Box component="span" sx={{ color: '#9E9E9E' }}> (cancelled)</Box>}
                    </Typography>
                ))}
                {history.length > MAX_HISTORY_SHOWN && <Typography sx={styles.muted}>+{history.length - MAX_HISTORY_SHOWN} more</Typography>}
            </>
        );
    };

    const renderReports = () => (
        <>
            <Typography sx={styles.line}>
                {context.reportsAgainst.length} against · {context.reportsFiled.length} filed
            </Typography>
            {context.reportsAgainst.slice(0, MAX_REPORTS_SHOWN).map((entry) => {
                const outcome = getOutcomeOption(entry.outcome);
                const isOpen = entry.status === PlayerReportStatus.Open;
                return (
                    <Typography key={entry.reportId} sx={styles.line}>
                        {formatDate(entry.createdAt, dateFormat)} · {getOffenseLabel(entry.offense)} ·{' '}
                        <Box component="span" sx={{ color: isOpen ? OPEN_TICKET_COLOR : outcome?.color }}>
                            {isOpen ? 'Open' : outcome?.label ?? 'Closed'}
                        </Box>
                    </Typography>
                );
            })}
        </>
    );

    const renderSameUsername = () => {
        const summary = context.sameUsername;
        if (!summary) {
            return <Typography sx={styles.muted}>Could not check for other accounts with this name.</Typography>;
        }
        if (summary.total === 0) {
            return <Typography sx={styles.muted}>No other account uses this name.</Typography>;
        }
        const unchecked = summary.total - summary.accounts.length;
        return (
            <>
                {summary.accounts.map((account) => (
                    <Typography key={account.playerId} sx={styles.line}>
                        <Box component="span" sx={{ color: MODERATION_STANDING_STYLES[account.standing].color, fontWeight: 600 }}>
                            {account.username}
                        </Box>
                        {' '}· created {formatDate(account.createdAt, dateFormat)} · last login {formatTimeAgoPhrase(account.lastLogin)}
                    </Typography>
                ))}
                {unchecked > 0 && <Typography sx={styles.muted}>+{unchecked} more not checked</Typography>}
            </>
        );
    };

    return (
        <Tooltip
            placement="bottom-start"
            enterDelay={300}
            describeChild
            componentsProps={{ tooltip: { sx: styles.tooltip } }}
            title={(
                <Box>
                    <Typography sx={styles.name}>{context.username}</Typography>
                    <Typography sx={styles.standing}>{standing.label}</Typography>
                    {renderAccount()}

                    <Typography sx={styles.section}>Active</Typography>
                    {activeRestrictions.length > 0
                        ? activeRestrictions.map((label) => <Typography key={label} sx={styles.restriction}>{label}</Typography>)
                        : <Typography sx={styles.muted}>No active mod actions</Typography>}

                    <Typography sx={styles.section}>History</Typography>
                    {renderHistory()}

                    <Typography sx={styles.section}>Reports</Typography>
                    {renderReports()}

                    {context.createdAt && (
                        <>
                            <Typography sx={styles.section}>Same Username</Typography>
                            {renderSameUsername()}
                        </>
                    )}
                </Box>
            )}
        >
            {children}
        </Tooltip>
    );
};

export default PlayerProfileTooltip;
