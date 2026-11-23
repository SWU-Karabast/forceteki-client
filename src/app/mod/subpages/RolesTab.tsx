import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Divider, MenuItem, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { ServerApiService } from '@/app/_services/ServerApiService';
import {
    IPlayerSearchResult,
    IServerRoleHolder,
    IServerRolesResponse,
    ServerRole,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDateTime } from '@/app/_utils/dateFormatUtils';

const RoleDetails: Record<ServerRole, { label: string; description: string }> = {
    [ServerRole.Admin]: { label: 'Admins', description: 'Everything, including server controls and this page. Passes every other role\'s check.' },
    [ServerRole.Developer]: { label: 'Developers', description: 'Developer tools. Also counts as a contributor.' },
    [ServerRole.Moderator]: { label: 'Moderators', description: 'The mod tools: reports, mod actions and card back cosmetics. Also counts as a contributor.' },
    [ServerRole.Contributor]: { label: 'Contributors', description: 'Contributor-only cosmetics.' },
};

const roleOrder = [ServerRole.Admin, ServerRole.Developer, ServerRole.Moderator, ServerRole.Contributor];

interface IPendingRemoval {
    holder: IServerRoleHolder;
    role: ServerRole;
}

const holderName = (holder: IServerRoleHolder) => holder.username ?? holder.note ?? holder.id;

const RolesTab: React.FC = () => {
    const dateFormat = useDateFormat();

    const [roles, setRoles] = useState<IServerRolesResponse | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [pendingRemoval, setPendingRemoval] = useState<IPendingRemoval | null>(null);

    const [roleToGrant, setRoleToGrant] = useState<ServerRole>(ServerRole.Developer);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<IPlayerSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const loadRoles = useCallback(async () => {
        try {
            setRoles(await ServerApiService.getServerRolesAsync());
            setErrorMessage(null);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to load roles');
        }
    }, []);

    useEffect(() => {
        void loadRoles();
    }, [loadRoles]);

    const changeRole = async (userId: string, name: string, role: ServerRole, granted: boolean) => {
        setIsSaving(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            setRoles(await ServerApiService.setServerRoleAsync(userId, role, granted));
            setSuccessMessage(`${name} ${granted ? 'is now' : 'is no longer'} in ${RoleDetails[role].label}.`);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to change the role');
            // the server refuses a change made from out-of-date roles, so show it the current ones
            void loadRoles();
        } finally {
            setIsSaving(false);
        }
    };

    const handleSearch = async () => {
        const query = searchQuery.trim();
        if (!query) {
            return;
        }

        setIsSearching(true);
        setErrorMessage(null);
        setSearchResults([]);
        try {
            const response = await ServerApiService.findUserAsync(query);
            setSearchResults(response.players);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to find the player');
        } finally {
            setIsSearching(false);
        }
    };

    const holdsRole = (userId: string, role: ServerRole) => roles?.roles[role].some((holder) => holder.id === userId) ?? false;

    // ======================== STYLES ========================
    const styles = {
        container: {
            maxWidth: '720px',
        },
        section: {
            mb: '2.5rem',
        },
        hint: {
            color: '#878787',
            fontSize: '0.9rem',
            mb: '1rem',
        },
        row: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            py: '0.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
        rowText: {
            display: 'flex',
            flexDirection: 'column' as const,
            minWidth: 0,
        },
        secondaryText: {
            color: '#878787',
            fontSize: '0.85rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        searchRow: {
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap' as const,
            gap: '1rem',
            mb: '1rem',
        },
        auditLine: {
            color: '#878787',
            fontSize: '0.85rem',
            mb: '1.5rem',
        },
    };

    return (
        <Box sx={styles.container}>
            <Typography variant={'h3'}>Roles</Typography>
            <Divider sx={{ mb: '20px' }} />

            {errorMessage && <Alert severity="error" sx={{ mb: '1rem' }}>{errorMessage}</Alert>}
            {successMessage && <Alert severity="success" sx={{ mb: '1rem' }}>{successMessage}</Alert>}

            {roles?.updatedBy && (
                <Typography sx={styles.auditLine}>
                    Last changed by {roles.updatedBy}
                    {roles.updatedAt ? ` on ${formatDateTime(roles.updatedAt, dateFormat)}` : ''}
                </Typography>
            )}

            <Box sx={styles.section}>
                <Typography variant={'h3'}>Grant a Role</Typography>
                <Divider sx={{ mb: '20px' }} />
                <Typography sx={styles.hint}>
                    Find a player by username or user ID, then grant them a role. The change applies straight away.
                </Typography>
                <Box sx={styles.searchRow}>
                    <StyledTextField
                        select
                        value={roleToGrant}
                        onChange={(event) => setRoleToGrant(event.target.value as ServerRole)}
                        sx={{ width: 180 }}
                    >
                        {roleOrder.map((role) => (
                            <MenuItem key={role} value={role}>{RoleDetails[role].label}</MenuItem>
                        ))}
                    </StyledTextField>
                    <StyledTextField
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event: React.KeyboardEvent) => {
                            if (event.key === 'Enter') {
                                void handleSearch();
                            }
                        }}
                        placeholder="Username or user ID"
                        sx={{ flex: 1, minWidth: 200 }}
                    />
                    <PreferenceButton
                        variant={'standard'}
                        text={isSearching ? 'Searching...' : 'Search'}
                        disabled={isSearching || !searchQuery.trim()}
                        buttonFnc={() => void handleSearch()}
                    />
                </Box>
                {searchResults.map((player) => (
                    <Box key={player.id} sx={styles.row}>
                        <Box sx={styles.rowText}>
                            <Typography>{player.username}</Typography>
                            <Typography sx={styles.secondaryText}>{player.id}</Typography>
                        </Box>
                        <PreferenceButton
                            variant={'standard'}
                            text={holdsRole(player.id, roleToGrant) ? `Already in ${RoleDetails[roleToGrant].label}` : `Add to ${RoleDetails[roleToGrant].label}`}
                            disabled={isSaving || !roles || holdsRole(player.id, roleToGrant)}
                            buttonFnc={() => void changeRole(player.id, player.username, roleToGrant, true)}
                        />
                    </Box>
                ))}
            </Box>

            {roles && roleOrder.map((role) => (
                <Box key={role} sx={styles.section}>
                    <Typography variant={'h3'}>{RoleDetails[role].label} ({roles.roles[role].length})</Typography>
                    <Divider sx={{ mb: '20px' }} />
                    <Typography sx={styles.hint}>{RoleDetails[role].description}</Typography>
                    {roles.roles[role].length === 0 && <Typography sx={styles.hint}>Nobody has this role.</Typography>}
                    {roles.roles[role].map((holder) => (
                        <Box key={holder.id} sx={styles.row}>
                            <Box sx={styles.rowText}>
                                <Typography>{holderName(holder)}</Typography>
                                <Typography sx={styles.secondaryText}>
                                    {holder.username === null ? `No account found for ${holder.id}` : holder.id}
                                    {holder.note && holder.note !== holder.username ? ` · ${holder.note}` : ''}
                                </Typography>
                            </Box>
                            <PreferenceButton
                                variant={'standard'}
                                text="Remove"
                                disabled={isSaving}
                                buttonFnc={() => setPendingRemoval({ holder, role })}
                            />
                        </Box>
                    ))}
                </Box>
            ))}

            <ConfirmationDialog
                open={pendingRemoval !== null}
                title="Remove role?"
                message={pendingRemoval
                    ? `Remove ${holderName(pendingRemoval.holder)} from ${RoleDetails[pendingRemoval.role].label}? They lose its access straight away.`
                    : ''}
                onConfirm={() => {
                    if (pendingRemoval) {
                        void changeRole(pendingRemoval.holder.id, holderName(pendingRemoval.holder), pendingRemoval.role, false);
                    }
                    setPendingRemoval(null);
                }}
                onCancel={() => setPendingRemoval(null)}
                confirmButtonText="Remove"
                cancelButtonText="Go Back"
            />
        </Box>
    );
};

export default RolesTab;
