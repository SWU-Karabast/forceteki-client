import React, { useState } from 'react';
import { Alert, Box, Checkbox, Chip, FormControlLabel, Switch, Typography } from '@mui/material';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import {
    FeatureFlagUpdate,
    IFeatureFlagState,
    IPlayerSearchResult,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerRole } from '@/app/_constants/constants';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDateTime } from '@/app/_utils/dateFormatUtils';
import PlayerSearch from './PlayerSearch';
import { ServerRoles } from './RolesTab';

// admins are changed only by hand in the database, so they are not offered as an audience here
const assignableRoles = Object.values(ServerRole).filter((role) => role !== ServerRole.Admin);

interface IFeatureFlagCardProps {
    flag: IFeatureFlagState;

    /** The server's message from the last change that failed, if any. */
    saveError?: string;

    /** A player's username: null when they have no account, undefined while it is not known yet. */
    usernameOf: (userId: string) => string | null | undefined;
    onChange: (updates: FeatureFlagUpdate) => void;
    onAddPlayer: (player: IPlayerSearchResult) => void;
}

/** Who the flag is on for, in words. */
const describeAudience = (flag: IFeatureFlagState) => {
    if (flag.enabled) {
        return 'On for everyone';
    }

    const parts: string[] = [];
    const roles = Object.values(ServerRole).filter((role) => flag.roles.includes(role));
    if (roles.length > 0) {
        parts.push(roles.map((role) => `${ServerRoles[role].label}s`).join(', '));
    }
    if (flag.userIds.length > 0) {
        parts.push(`${flag.userIds.length} ${flag.userIds.length === 1 ? 'player' : 'players'}`);
    }

    return parts.length > 0 ? `On for ${parts.join(' and ')}` : 'Off for everyone';
};

const FeatureFlagCard: React.FC<IFeatureFlagCardProps> = ({ flag, saveError, usernameOf, onChange, onAddPlayer }) => {
    const dateFormat = useDateFormat();
    const [confirmOpen, setConfirmOpen] = useState(false);

    const hasAudience = flag.roles.length > 0 || flag.userIds.length > 0;
    const statusColor = flag.enabled ? '#7BD88F' : hasAudience ? '#7DB9E3' : '#F0B36A';

    const handleEveryoneToggled = (enabled: boolean) => {
        // turning a feature on for every player is the one change here that reaches everyone, so it asks first
        if (enabled) {
            setConfirmOpen(true);
            return;
        }
        onChange({ enabled: false });
    };

    const toggleRole = (role: ServerRole, ticked: boolean) => {
        onChange({ roles: ticked ? [...flag.roles, role] : flag.roles.filter((r) => r !== role) });
    };

    const removePlayer = (userId: string) => {
        onChange({ userIds: flag.userIds.filter((id) => id !== userId) });
    };

    const playerLabel = (userId: string) => {
        const username = usernameOf(userId);
        if (username === null) {
            return `No account: ${userId.slice(0, 8)}…`;
        }
        return username ?? userId;
    };

    // ======================== STYLES ========================
    const styles = {
        card: {
            border: '1px solid #2F7DB6',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            p: '1.25rem',
            mb: '2rem',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1.25rem',
        },
        headerRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '0.75rem',
        },
        title: {
            fontSize: '1.4rem',
            fontWeight: 600,
            mb: '0.4rem',
        },
        keyRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            alignItems: 'center',
            gap: '0.5rem',
        },
        flagKey: {
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            color: '#9A9A9A',
        },
        pill: {
            color: '#D6D6D6',
            borderColor: '#3A444A',
            height: 24,
        },
        auditLine: {
            color: '#9A9A9A',
            fontSize: '0.85rem',
        },
        statusRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            px: '1rem',
            py: '0.5rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
        },
        status: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '1.1rem',
            fontWeight: 600,
            color: statusColor,
        },
        statusDot: {
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: statusColor,
        },
        switchLabel: {
            m: 0,
            color: 'white',
        },
        ignoredNote: {
            color: '#F0B36A',
            fontSize: '0.9rem',
            mt: '-0.5rem',
        },
        audience: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1.5rem',
            opacity: flag.enabled ? 0.45 : 1,
        },
        sectionTitle: {
            fontSize: '1.1rem',
            fontWeight: 600,
            mb: '0.6rem',
        },
        count: {
            color: '#9A9A9A',
            fontWeight: 400,
        },
        roleOptions: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.6rem',
        },
        roleOption: {
            m: 0,
            minHeight: '52px',
            px: '0.5rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: 'white',
            '& .MuiFormControlLabel-label': { fontWeight: 600 },
        },
        checkbox: {
            color: '#B0B0B0',
            '&.Mui-checked': { color: '#2F7DB6' },
        },
        playerChips: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.5rem',
        },
        playerChip: (hasAccount: boolean) => ({
            color: hasAccount ? 'white' : '#F0B36A',
            borderColor: hasAccount ? '#3A444A' : '#8A6A3E',
            '& .MuiChip-deleteIcon': { color: '#B0B0B0' },
        }),
        hint: {
            color: '#9A9A9A',
            fontSize: '0.9rem',
        },
    };

    return (
        <Box component="section" aria-label={flag.flag} sx={styles.card}>
            <Box sx={styles.headerRow}>
                <Box>
                    <Typography sx={styles.title}>{flag.description}</Typography>
                    <Box sx={styles.keyRow}>
                        <Typography component="code" sx={styles.flagKey}>{flag.flag}</Typography>
                        <Chip
                            label={flag.exposeToClient ? 'Sent to client' : 'Server only'}
                            variant="outlined"
                            size="small"
                            sx={styles.pill}
                        />
                    </Box>
                </Box>
                {flag.updatedBy && (
                    <Typography sx={styles.auditLine}>
                        Last changed by {flag.updatedBy}
                        {flag.updatedAt ? ` · ${formatDateTime(flag.updatedAt, dateFormat)}` : ''}
                    </Typography>
                )}
            </Box>

            {saveError && <Alert severity="error">{saveError}</Alert>}

            <Box sx={styles.statusRow}>
                <Typography sx={styles.status}>
                    <Box component="span" aria-hidden="true" sx={styles.statusDot} />
                    {describeAudience(flag)}
                </Typography>
                <FormControlLabel
                    sx={styles.switchLabel}
                    label="On for everyone"
                    control={
                        <Switch
                            checked={flag.enabled}
                            onChange={(event) => handleEveryoneToggled(event.target.checked)}
                        />
                    }
                />
            </Box>

            {flag.enabled && (
                <Typography sx={styles.ignoredNote}>
                    The roles and players below are kept but ignored while the flag is on for everyone. Turn it off
                    to go back to them.
                </Typography>
            )}

            <Box sx={styles.audience}>
                <Box>
                    <Typography sx={styles.sectionTitle}>Roles</Typography>
                    <Box sx={styles.roleOptions}>
                        {assignableRoles.map((role) => (
                            <FormControlLabel
                                key={role}
                                sx={styles.roleOption}
                                label={ServerRoles[role].label}
                                control={
                                    <Checkbox
                                        checked={flag.roles.includes(role)}
                                        onChange={(event) => toggleRole(role, event.target.checked)}
                                        sx={styles.checkbox}
                                    />
                                }
                            />
                        ))}
                    </Box>
                </Box>

                <Box>
                    <Typography sx={styles.sectionTitle}>
                        Players <Box component="span" sx={styles.count}>({flag.userIds.length})</Box>
                    </Typography>
                    <PlayerSearch onSelect={onAddPlayer} />
                    {flag.userIds.length > 0 ? (
                        <Box sx={styles.playerChips}>
                            {flag.userIds.map((userId) => (
                                <Chip
                                    key={userId}
                                    label={playerLabel(userId)}
                                    title={userId}
                                    variant="outlined"
                                    onDelete={() => removePlayer(userId)}
                                    sx={styles.playerChip(usernameOf(userId) !== null)}
                                />
                            ))}
                        </Box>
                    ) : (
                        <Typography sx={styles.hint}>No players yet. Find one above to add them.</Typography>
                    )}
                </Box>
            </Box>

            <ConfirmationDialog
                open={confirmOpen}
                title="Turn on for everyone?"
                message={`Every player, signed in or not, gets "${flag.description}" from their next request.`}
                onConfirm={() => {
                    setConfirmOpen(false);
                    onChange({ enabled: true });
                }}
                onCancel={() => setConfirmOpen(false)}
                confirmButtonText="Turn On"
                confirmButtonVariant="standard"
            />
        </Box>
    );
};

export default FeatureFlagCard;
