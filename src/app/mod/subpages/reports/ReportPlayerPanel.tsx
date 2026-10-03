import React from 'react';
import { Box, Typography } from '@mui/material';
import { ModActionType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { getMuteDisplayText } from '@/app/_utils/ModerationUtils';
import { IReportPlayerPanelProps } from './reportTypes';

/**
 * One side of a report (reporter or reported player). Clicking the card selects the player as the
 * target for quick actions and for the history column.
 */
const ReportPlayerPanel: React.FC<IReportPlayerPanelProps> = ({ roleLabel, context, usernameAtReport, selected, onSelect, onOpenProfile }) => {
    const openMutes = context.modActions.filter((action) => action.actionType === ModActionType.Mute && !action.cancelledAt);
    const runningMute = openMutes.find((action) => action.expiresAt && new Date(action.expiresAt) > new Date());
    const hasPendingMute = openMutes.some((action) => !action.startedAt);

    // The server reports pending mutes as muted too, so check the action itself first
    let muteText: string | null = null;
    if (runningMute?.expiresAt) {
        muteText = `Muted for ${getMuteDisplayText({ endDate: new Date(runningMute.expiresAt) })}`;
    } else if (hasPendingMute) {
        muteText = 'Mute pending (starts at next login)';
    } else if (context.isMuted) {
        muteText = 'Muted';
    }

    // ----------------Styles----------------//
    const styles = {
        card: {
            flex: 1,
            border: selected ? '2px solid #2F7DB6' : '1px solid #4A5568',
            borderRadius: '8px',
            padding: selected ? 'calc(0.75rem - 1px)' : '0.75rem',
            backgroundColor: selected ? 'rgba(47, 125, 182, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.15)',
            },
        },
        roleLabel: {
            color: '#9e9e9e',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase' as const,
            mb: '0.25rem',
        },
        nameRow: {
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '0.5rem',
        },
        name: {
            color: 'white',
            fontSize: '1.05rem',
            fontWeight: 600,
            mb: 0,
        },
        profileLink: {
            color: '#64b5f6',
            fontSize: '0.75rem',
            cursor: 'pointer',
            whiteSpace: 'nowrap' as const,
            '&:hover': { textDecoration: 'underline' },
        },
        renamedHint: {
            color: '#9e9e9e',
            fontSize: '0.75rem',
            mb: '0.25rem',
        },
        stat: {
            color: '#B0B0B0',
            fontSize: '0.8rem',
            mb: 0,
        },
        statusMuted: {
            color: '#ef5350',
            fontSize: '0.8rem',
            fontWeight: 600,
            mt: '0.25rem',
            mb: 0,
        },
        statusRename: {
            color: '#ffd54f',
            fontSize: '0.8rem',
            fontWeight: 600,
            mb: 0,
        },
    };

    return (
        <Box sx={styles.card} onClick={onSelect} role="button" aria-pressed={selected}>
            <Typography sx={styles.roleLabel}>{roleLabel}{selected ? ' · selected' : ''}</Typography>
            <Box sx={styles.nameRow}>
                <Typography sx={styles.name}>{context.username}</Typography>
                <Typography
                    sx={styles.profileLink}
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenProfile();
                    }}
                >
                    Open profile ↗
                </Typography>
            </Box>
            {context.username !== usernameAtReport && (
                <Typography sx={styles.renamedHint}>was {usernameAtReport} at report time</Typography>
            )}
            <Typography sx={styles.stat}>Reports against: {context.reportsAgainst.length}</Typography>
            <Typography sx={styles.stat}>Reports filed: {context.reportsFiled.length}</Typography>
            {muteText && <Typography sx={styles.statusMuted}>{muteText}</Typography>}
            {context.activeRename && <Typography sx={styles.statusRename}>Pending force rename</Typography>}
        </Box>
    );
};

export default ReportPlayerPanel;
