import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Checkbox, Chip, CircularProgress, Divider, FormControlLabel, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { ServerApiService } from '@/app/_services/ServerApiService';
import {
    IPlayerSearchResult,
    IServerRolesResponse,
    ServerRole,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDateTime } from '@/app/_utils/dateFormatUtils';

const RoleDetails: Record<ServerRole, { label: string; color: string }> = {
    [ServerRole.Admin]: { label: 'Admin', color: '#E8796D' },
    [ServerRole.Developer]: { label: 'Developer', color: '#B39CF5' },
    [ServerRole.Moderator]: { label: 'Moderator', color: '#5FB0E6' },
    [ServerRole.Contributor]: { label: 'Contributor', color: '#DCB84F' },
};

const roleOrder = [ServerRole.Admin, ServerRole.Developer, ServerRole.Moderator, ServerRole.Contributor];

// admins are changed only by hand in the database, so the server refuses changes to them
const editableRoles = roleOrder.filter((role) => role !== ServerRole.Admin);

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
    for (const role of roleOrder) {
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

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<IPlayerSearchResult[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [selectedPlayer, setSelectedPlayer] = useState<Omit<IRolePlayer, 'roles'> | null>(null);
    const [savingRole, setSavingRole] = useState<ServerRole | null>(null);

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

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) {
            return;
        }

        setIsSearching(true);
        setErrorMessage(null);
        setSearchResults(null);
        try {
            const { players } = await ServerApiService.findUserAsync(query);
            if (players.length === 1) {
                selectPlayer({ id: players[0].id, username: players[0].username, note: null });
            } else {
                setSearchResults(players);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to find the player');
        } finally {
            setIsSearching(false);
        }
    };

    const selectPlayer = (player: Omit<IRolePlayer, 'roles'>) => {
        setSelectedPlayer({ id: player.id, username: player.username, note: player.note });
        setSearchResults(null);
        setErrorMessage(null);
    };

    const changeRole = async (role: ServerRole, granted: boolean) => {
        if (!selectedPlayer) {
            return;
        }

        setSavingRole(role);
        setErrorMessage(null);
        try {
            setRoles(await ServerApiService.setServerRoleAsync(selectedPlayer.id, role, granted));
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to change the role');
            // the server refuses a change made at the same time as another, so show it the current roles
            void loadRoles();
        } finally {
            setSavingRole(null);
        }
    };

    const toggleListFilter = (filter: RoleListFilter) => {
        setListFilters((current) => (current.includes(filter) ? current.filter((f) => f !== filter) : [...current, filter]));
    };

    const countWith = (filter: RoleListFilter) => rolePlayers.filter((player) =>
        (filter === NoAccountFilter ? player.username === null : player.roles.includes(filter))
    ).length;

    // ======================== STYLES ========================
    const styles = {
        container: {
            maxWidth: '880px',
        },
        hint: {
            color: '#9A9A9A',
            fontSize: '0.9rem',
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
        searchRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            mb: '1rem',
        },
        searchResult: {
            all: 'unset',
            boxSizing: 'border-box',
            display: 'flex',
            width: '100%',
            gap: '0.75rem',
            alignItems: 'baseline',
            p: '0.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            '&:hover': { backgroundColor: 'rgba(47, 125, 182, 0.18)' },
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
        savingOption: {
            borderColor: '#2F7DB6',
        },
        checkbox: {
            color: '#B0B0B0',
            '&.Mui-checked': { color: '#2F7DB6' },
        },
        spinner: {
            color: '#7CC2F0',
            m: '9px',
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

            <Box sx={styles.searchRow}>
                <StyledTextField
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event: React.KeyboardEvent) => {
                        if (event.key === 'Enter') {
                            void handleSearch();
                        }
                    }}
                    placeholder="Find a player by username or user ID"
                />
                <PreferenceButton
                    variant={'standard'}
                    text={isSearching ? 'Searching...' : 'Search'}
                    disabled={isSearching || !searchQuery.trim()}
                    buttonFnc={() => void handleSearch()}
                />
            </Box>

            {searchResults && searchResults.length === 0 && (
                <Typography sx={{ ...styles.hint, mb: '1rem' }}>No player found.</Typography>
            )}
            {searchResults && searchResults.length > 0 && (
                <Box sx={{ mb: '1rem' }}>
                    {searchResults.map((player) => (
                        <Box
                            key={player.id}
                            component="button"
                            sx={styles.searchResult}
                            onClick={() => selectPlayer({ id: player.id, username: player.username, note: null })}
                        >
                            <Typography>{player.username}</Typography>
                            <Typography sx={styles.secondaryText}>{player.id}</Typography>
                        </Box>
                    ))}
                </Box>
            )}

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
                                sx={savingRole === role ? { ...styles.roleOption, ...styles.savingOption } : styles.roleOption}
                                label={RoleDetails[role].label}
                                control={savingRole === role
                                    ? <CircularProgress size={22} sx={styles.spinner} aria-label={`Saving ${RoleDetails[role].label}`} />
                                    : (
                                        <Checkbox
                                            checked={selectedRoles.includes(role)}
                                            disabled={savingRole !== null}
                                            onChange={(event) => void changeRole(role, event.target.checked)}
                                            sx={styles.checkbox}
                                        />
                                    )}
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
                    label={`All ${rolePlayers.length}`}
                    variant="outlined"
                    clickable
                    onClick={() => setListFilters([])}
                    sx={styles.filterChip(listFilters.length === 0)}
                />
                {roleOrder.map((role) => (
                    <Chip
                        key={role}
                        label={`${RoleDetails[role].label} ${countWith(role)}`}
                        icon={<Box sx={styles.colorDot(RoleDetails[role].color)} />}
                        variant="outlined"
                        clickable
                        onClick={() => toggleListFilter(role)}
                        sx={styles.filterChip(listFilters.includes(role))}
                    />
                ))}
                {countWith(NoAccountFilter) > 0 && (
                    <Chip
                        label={`No account ${countWith(NoAccountFilter)}`}
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
                            <Chip key={role} label={RoleDetails[role].label} variant="outlined" size="small" sx={styles.roleChip(RoleDetails[role].color)} />
                        ))}
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default RolesTab;
