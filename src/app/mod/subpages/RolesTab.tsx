import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Checkbox, Chip, Divider, FormControlLabel, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { IServerRolesResponse } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerRole } from '@/app/_constants/constants';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDateTime } from '@/app/_utils/dateFormatUtils';
import PlayerSearch from './PlayerSearch';
import { ServerRoles } from './serverRoles';

// admins are changed only by hand in the database, so the server refuses changes to them
const editableRoles = Object.values(ServerRole).filter((role) => role !== ServerRole.Admin);

const NoAccountFilter = 'noAccount';
type RoleListFilter = ServerRole | typeof NoAccountFilter;

interface IRolePlayer {
    id: string;

    /** Null when the user has no profile, for example a stale id in the stored lists. */
    username: string | null;
    note: string | null;
    roles: ServerRole[];
}

const playerName = (player: Pick<IRolePlayer, 'id' | 'username' | 'note'>) => player.username ?? player.note ?? player.id;

/** Everyone holding at least one role, with all their roles, in alphabetical order. */
const buildRolePlayers = (roles: IServerRolesResponse): IRolePlayer[] => {
    const players = new Map<string, IRolePlayer>();
    for (const role of Object.values(ServerRole)) {
        for (const holder of roles.roles[role]) {
            const player = players.get(holder.id) ?? { id: holder.id, username: holder.username, note: holder.note, roles: [] };
            player.roles.push(role);
            players.set(holder.id, player);
        }
    }

    return [...players.values()].sort((a, b) => playerName(a).localeCompare(playerName(b), undefined, { sensitivity: 'base' }));
};

const RolesTab: React.FC = () => {
    const dateFormat = useDateFormat();

    const [roles, setRoles] = useState<IServerRolesResponse | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [selectedPlayer, setSelectedPlayer] = useState<Omit<IRolePlayer, 'roles'> | null>(null);
    const latestChange = useRef(0);

    const [listFilterText, setListFilterText] = useState('');
    const [listFilters, setListFilters] = useState<RoleListFilter[]>([]);

    const loadRoles = useCallback(async () => {
        try {
            setRoles(await ServerApiService.getServerRolesAsync());
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load roles');
        }
    }, []);

    useEffect(() => {
        void loadRoles();
    }, [loadRoles]);

    const rolePlayers = useMemo(() => (roles ? buildRolePlayers(roles) : []), [roles]);

    const filteredPlayers = useMemo(() => {
        const text = listFilterText.trim().toLowerCase();
        return rolePlayers.filter((player) => {
            if (text && !playerName(player).toLowerCase().includes(text) && !player.id.toLowerCase().includes(text)) {
                return false;
            }
            if (listFilters.length === 0) {
                return true;
            }
            return listFilters.some((filter) => (filter === NoAccountFilter ? player.username === null : player.roles.includes(filter)));
        });
    }, [rolePlayers, listFilterText, listFilters]);

    const selectedRoles = selectedPlayer
        ? rolePlayers.find((player) => player.id === selectedPlayer.id)?.roles ?? []
        : [];

    const selectPlayer = (player: Omit<IRolePlayer, 'roles'>) => {
        setSelectedPlayer({ id: player.id, username: player.username, note: player.note });
        setErrorMessage(null);
    };

    const changeRole = async (role: ServerRole, granted: boolean) => {
        if (!selectedPlayer) {
            return;
        }

        const player = selectedPlayer;
        const change = ++latestChange.current;
        setErrorMessage(null);

        // show the change straight away; the server's reply replaces it
        setRoles((current) => {
            if (!current) {
                return current;
            }
            const holders = current.roles[role].filter((holder) => holder.id !== player.id);
            const updated = granted ? [...holders, { id: player.id, username: player.username, note: player.note }] : holders;
            return { ...current, roles: { ...current.roles, [role]: updated } };
        });

        try {
            const response = await ServerApiService.setServerRoleAsync(player.id, role, granted);
            // an earlier reply arriving after a later change would undo that change on screen
            if (change === latestChange.current) {
                setRoles(response);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to change the role');
            void loadRoles();
        }
    };

    const toggleListFilter = (filter: RoleListFilter) => {
        setListFilters((current) => (current.includes(filter) ? current.filter((f) => f !== filter) : [...current, filter]));
    };

    const countWith = (filter: RoleListFilter) => rolePlayers.filter((player) =>
        (filter === NoAccountFilter ? player.username === null : player.roles.includes(filter))
    ).length;

    const chipLabel = (label: string, count: number) => (
        <>{label}<Box component="span" sx={styles.chipCount}>{count}</Box></>
    );

    // ======================== STYLES ========================
    const styles = {
        container: {
            maxWidth: '880px',
        },
        auditLine: {
            color: '#9A9A9A',
            fontSize: '0.85rem',
        },
        headerRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '0.5rem',
        },
        playerPanel: {
            border: '1px solid #2F7DB6',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            p: '1.25rem',
            mb: '2rem',
        },
        playerName: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            alignItems: 'baseline',
            gap: '0.75rem',
            mb: '1rem',
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
        filterRow: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            alignItems: 'center',
            gap: '0.6rem',
            mb: '0.5rem',
        },
        filterChip: (active: boolean, color?: string) => ({
            color: active ? 'white' : '#D6D6D6',
            borderColor: active ? '#2F7DB6' : '#3A444A',
            backgroundColor: active ? 'rgba(47, 125, 182, 0.35)' : 'transparent',
            '& .MuiChip-icon': { color },
        }),
        chipCount: {
            ml: '8px',
        },
        colorDot: (color: string) => ({
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: color,
        }),
        countLine: {
            color: '#9A9A9A',
            fontSize: '0.85rem',
            px: '0.6rem',
            py: '0.4rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
        playerRow: (selected: boolean) => ({
            all: 'unset',
            boxSizing: 'border-box',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            p: '0.75rem 0.6rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            backgroundColor: selected ? 'rgba(47, 125, 182, 0.18)' : 'transparent',
            '&:hover': { backgroundColor: 'rgba(47, 125, 182, 0.18)' },
        }),
        rowName: {
            flex: '1 1 200px',
            minWidth: 0,
        },
        secondaryText: {
            color: '#9A9A9A',
            fontSize: '0.85rem',
        },
        noAccountText: {
            color: '#F0B36A',
            fontSize: '0.85rem',
        },
        roleChips: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.4rem',
        },
        roleChip: (color: string) => ({
            color,
            borderColor: color,
            height: 24,
        }),
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.headerRow}>
                <Typography variant={'h3'}>Roles</Typography>
                {roles?.updatedBy && (
                    <Typography sx={styles.auditLine}>
                        Last changed by {roles.updatedBy}
                        {roles.updatedAt ? ` · ${formatDateTime(roles.updatedAt, dateFormat)}` : ''}
                    </Typography>
                )}
            </Box>
            <Divider sx={{ mb: '20px' }} />

            {errorMessage && <Alert severity="error" sx={{ mb: '1rem' }}>{errorMessage}</Alert>}

            <PlayerSearch onSelect={(player) => selectPlayer({ id: player.id, username: player.username, note: null })} />

            {selectedPlayer && roles && (
                <Box sx={styles.playerPanel}>
                    <Box sx={styles.playerName}>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 600 }}>{playerName(selectedPlayer)}</Typography>
                        <Typography sx={selectedPlayer.username === null ? styles.noAccountText : styles.secondaryText}>
                            {selectedPlayer.username === null ? `No account found for ${selectedPlayer.id}` : selectedPlayer.id}
                        </Typography>
                    </Box>
                    <Box sx={styles.roleOptions}>
                        {editableRoles.map((role) => (
                            <FormControlLabel
                                key={role}
                                sx={styles.roleOption}
                                label={ServerRoles[role].label}
                                control={
                                    <Checkbox
                                        checked={selectedRoles.includes(role)}
                                        onChange={(event) => void changeRole(role, event.target.checked)}
                                        sx={styles.checkbox}
                                    />
                                }
                            />
                        ))}
                    </Box>
                </Box>
            )}

            <Typography variant={'h3'}>Everyone with a role ({rolePlayers.length})</Typography>
            <Divider sx={{ mb: '14px' }} />

            <Box sx={styles.filterRow}>
                <StyledTextField
                    value={listFilterText}
                    onChange={(event) => setListFilterText(event.target.value)}
                    placeholder="Filter by name or ID"
                    size="small"
                    sx={{ flex: '1 1 220px', width: 'auto' }}
                />
                <Chip
                    label={chipLabel('All', rolePlayers.length)}
                    variant="outlined"
                    clickable
                    onClick={() => setListFilters([])}
                    sx={styles.filterChip(listFilters.length === 0)}
                />
                {Object.values(ServerRole).map((role) => (
                    <Chip
                        key={role}
                        label={chipLabel(ServerRoles[role].label, countWith(role))}
                        icon={<Box sx={styles.colorDot(ServerRoles[role].color)} />}
                        variant="outlined"
                        clickable
                        onClick={() => toggleListFilter(role)}
                        sx={styles.filterChip(listFilters.includes(role))}
                    />
                ))}
                {countWith(NoAccountFilter) > 0 && (
                    <Chip
                        label={chipLabel('No account', countWith(NoAccountFilter))}
                        variant="outlined"
                        clickable
                        onClick={() => toggleListFilter(NoAccountFilter)}
                        sx={styles.filterChip(listFilters.includes(NoAccountFilter))}
                    />
                )}
            </Box>

            <Typography sx={styles.countLine}>Showing {filteredPlayers.length} of {rolePlayers.length}</Typography>
            {filteredPlayers.map((player) => (
                <Box
                    key={player.id}
                    component="button"
                    sx={styles.playerRow(selectedPlayer?.id === player.id)}
                    onClick={() => selectPlayer(player)}
                >
                    <Box sx={styles.rowName}>
                        <Typography component="span">{playerName(player)} </Typography>
                        <Typography component="span" sx={player.username === null ? styles.noAccountText : styles.secondaryText}>
                            {player.username === null ? `No account found for ${player.id}` : player.id}
                        </Typography>
                    </Box>
                    <Box sx={styles.roleChips}>
                        {player.roles.map((role) => (
                            <Chip key={role} label={ServerRoles[role].label} variant="outlined" size="small" sx={styles.roleChip(ServerRoles[role].color)} />
                        ))}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default RolesTab;
