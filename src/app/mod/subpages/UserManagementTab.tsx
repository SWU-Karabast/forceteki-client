'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { ServerApiService } from '@/app/_services/ServerApiService';
import {
    IModActionResponse,
    IPlayerSearchResult,
    IUsernameChangeResponse,
    modActionDefinitions,
    UsernameChangeSource
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import ModActionForm from '@/app/_components/_sharedcomponents/ModActions/ModActionForm';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { buildUserHistory, formatDate, formatDuration, formatUsernameTransition, getActionStatus, getModActionEntryLabel, getUsernameChangeLabel, getUsernameChangeSourceLabel } from '@/app/_utils/ModerationUtils';
import { IModActionResult, modActionTargetFromPlayer } from '@/app/_utils/modActionSubmission';

interface IUserManagementTabProps {

    /** Search to run on mount or whenever it changes, e.g. when a report opens a player's profile */
    searchRequest?: { query: string; requestId: number } | null;

    /** Called once the search request ran, so returning to this tab later does not repeat it */
    onSearchRequestHandled?: () => void;
}

const UserManagementTab: React.FC<IUserManagementTabProps> = ({ searchRequest, onSearchRequestHandled }) => {
    const dateFormat = useDateFormat();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Player state
    const [players, setPlayers] = useState<IPlayerSearchResult[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<IPlayerSearchResult | null>(null);
    const [modActions, setModActions] = useState<IModActionResponse[]>([]);
    const [usernameChanges, setUsernameChanges] = useState<IUsernameChangeResponse[]>([]);

    // Action history expanded state
    const [expandedActionId, setExpandedActionId] = useState<string | null>(null);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
    }>({ open: false, title: '', message: '', onConfirm: () => {}, confirmText: undefined });

    // Submit/cancel loading
    const [submitLoading, setSubmitLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // ==================== Handlers ====================
    const handleSearch = () => runSearch(searchQuery);

    const runSearch = async (query: string) => {
        if (!query.trim()) return;

        setSearchLoading(true);
        setSearchError(null);
        setSelectedPlayer(null);
        setModActions([]);
        setUsernameChanges([]);
        setPlayers([]);
        setSuccessMessage(null);

        try {
            const result = await ServerApiService.findUserAsync(query.trim());
            setPlayers(result.players);
            setModActions(result.modActions || []);
            setUsernameChanges(result.usernameChanges || []);

            // Auto-select if single result
            if (result.players.length === 1) {
                setSelectedPlayer(result.players[0]);
            }
        } catch (error) {
            setSearchError('Failed to find user');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectPlayer = async (player: IPlayerSearchResult) => {
        setSelectedPlayer(player);
        setSuccessMessage(null);

        // If we don't have mod actions yet (multi-result case), fetch them
        if (modActions.length === 0 || players.length > 1) {
            try {
                const result = await ServerApiService.getModActionsForPlayerAsync(player.id);
                setModActions(result.modActions || []);
                setUsernameChanges(result.usernameChanges || []);
            } catch (error) {
                console.error('Failed to fetch mod actions:', error);
            }
        }
    };

    useEffect(() => {
        if (searchRequest?.query) {
            setSearchQuery(searchRequest.query);
            runSearch(searchRequest.query);
            onSearchRequestHandled?.();
        }
        // runSearch is recreated every render; only a new request should trigger a search
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchRequest?.requestId]);

    const refreshSelectedPlayerAsync = async (playerId: string) => {
        const refreshed = await ServerApiService.getModActionsForPlayerAsync(playerId);
        setModActions(refreshed.modActions || []);
        setUsernameChanges(refreshed.usernameChanges || []);
        // since we have a selected player the refreshed player will always be one.
        setSelectedPlayer(refreshed.players[0]);
    };

    const handleActionSubmitted = async (result: IModActionResult) => {
        if (!selectedPlayer) return;

        setSuccessMessage(result.success ? result.message : null);
        setSearchError(result.success ? null : result.message);
        try {
            await refreshSelectedPlayerAsync(selectedPlayer.id);
        } catch (error) {
            const failure = error instanceof Error ? error.message : 'unknown error';
            setSearchError(`${result.message} Failed to refresh the player: ${failure}`);
        }
    };

    const handleCancelAction = (action: IModActionResponse) => {
        if (!selectedPlayer) return;

        setConfirmDialog({
            open: true,
            title: 'Cancel Mod Action',
            message: 'Are you sure you wish to cancel this moderation action?',
            confirmText: 'Cancel Moderation Action',
            onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                setSubmitLoading(true);
                try {
                    await ServerApiService.cancelModActionAsync(selectedPlayer.id, action.id);
                    await refreshSelectedPlayerAsync(selectedPlayer.id);
                    setSuccessMessage('Mod action cancelled successfully');
                } catch (error) {
                    setSearchError(error instanceof Error ? error.message : 'Failed to cancel action');
                } finally {
                    setSubmitLoading(false);
                }
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    // ==================== Styles ====================
    const styles = {
        container: {
            display: 'flex',
            gap: '2rem',
            width: '100%',
            minHeight: '400px',
        },
        leftColumn: {
            flex: 2,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1.5rem',
        },
        rightColumn: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '0.5rem',
        },
        sectionTitle: {
            color: 'white',
            fontSize: '1rem',
            fontWeight: 600,
            mb: '0.5rem',
        },
        searchRow: {
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
        },
        userDetailRow: {
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            mb:'10px'
        },
        userDetailLabel: {
            color: '#81c784',
            fontSize: '0.875rem',
            fontWeight: 600,
            mb:'0',
            minWidth: '90px',
        },
        userDetailValue: {
            color: 'white',
            fontSize: '0.875rem',
        },
        actionHistoryItem: {
            border: '1px solid #4A5568',
            borderRadius: '8px',
            overflow: 'hidden',
            mb: '0.5rem',
        },
        actionHistoryHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.15)',
            },
        },
        actionHistoryDetails: {
            padding: '0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid #4A5568',
        },
        statusBadge: (color: string) => ({
            color,
            fontSize: '0.75rem',
            fontWeight: 600,
            ml: '0.5rem',
            flexShrink: 0,
            whiteSpace: 'nowrap',
        }),
        cancelButton: {
            color: '#ef5350',
            fontSize: '0.75rem',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
        },
        actionHistoryContainer: {
            maxHeight: '400px',
            overflowY: 'auto' as const,
            '::-webkit-scrollbar': { width: '0.2vw' },
            '::-webkit-scrollbar-thumb': { backgroundColor: '#D3D3D3B3', borderRadius: '1vw' },
            '::-webkit-scrollbar-button': { display: 'none' },
        },
        multiPlayerItem: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.5rem 0.75rem',
            border: '1px solid #4A5568',
            borderRadius: '8px',
            cursor: 'pointer',
            mb: '0.5rem',
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.15)',
            },
        },
        alertMessage: {
            mb: 2,
            bgcolor: 'rgba(0, 0, 0, 0.2)',
            color: 'red',
            fontSize: '0.775rem',
        },

    };
    // ==================== Render ====================
    const history = useMemo(
        () => (selectedPlayer ? buildUserHistory(modActions, usernameChanges) : []),
        [selectedPlayer, modActions, usernameChanges],
    );
    return (
        <Box>
            {/* Messages */}
            {searchError && (
                <Alert severity="error" sx={styles.alertMessage} onClose={() => setSearchError(null)}>
                    {searchError}
                </Alert>
            )}
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            )}

            <Box sx={styles.container}>
                {/* ==================== Left Column ==================== */}
                <Box sx={styles.leftColumn}>
                    {/* Search */}
                    <Box>
                        <Typography sx={styles.sectionTitle}>Find User</Typography>
                        <Box sx={styles.searchRow}>
                            <StyledTextField
                                placeholder="Search by user ID or username"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                            <PreferenceButton
                                variant="standard"
                                text={searchLoading ? '' : 'Search'}
                                buttonFnc={handleSearch}
                                disabled={searchLoading || !searchQuery.trim()}
                            />
                        </Box>
                    </Box>

                    {/* Multi-player selection */}
                    {players.length > 1 && !selectedPlayer && (
                        <Box>
                            <Typography sx={styles.sectionTitle}>Multiple Players Found</Typography>
                            {players.map((player) => (
                                <Box
                                    key={player.id}
                                    sx={styles.multiPlayerItem}
                                    onClick={() => handleSelectPlayer(player)}
                                >
                                    <Box>
                                        <Box sx={styles.userDetailRow}>
                                            <Typography sx={{ color: 'white', fontSize: '0.875rem', mb:'0px' }}>
                                                Username:
                                            </Typography>
                                            <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                                                {player.username}
                                            </Typography>
                                        </Box>
                                        <Box sx={styles.userDetailRow}>
                                            <Typography sx={{ color: 'white', fontSize: '0.875rem', mb:'0px' }}>
                                                ID:
                                            </Typography>
                                            <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                                                {player.id}
                                            </Typography>
                                        </Box>
                                        <Box sx={styles.userDetailRow}>
                                            <Typography sx={{ color: 'white', fontSize: '0.875rem', mb:'0px' }}>
                                                Last active:
                                            </Typography>
                                            <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                                                {formatDate(player.lastLogin, dateFormat)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    {player.isMuted && (
                                        <Typography sx={{ color: '#ef5350', fontSize: '0.75rem', fontWeight: 600 }}>
                                            Muted
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    )}

                    {/* User Details */}
                    {selectedPlayer && (
                        <Box>
                            <Typography sx={styles.sectionTitle}>User Details</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Username:</Typography>
                                    <Typography sx={styles.userDetailValue}>{selectedPlayer.username}</Typography>
                                </Box>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Player ID:</Typography>
                                    <Typography sx={{ ...styles.userDetailValue }}>
                                        {selectedPlayer.id}
                                    </Typography>
                                </Box>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Last login:</Typography>
                                    <Typography sx={styles.userDetailValue}>
                                        {formatDate(selectedPlayer.lastLogin, dateFormat)}
                                    </Typography>
                                </Box>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Created:</Typography>
                                    <Typography sx={styles.userDetailValue}>
                                        {formatDate(selectedPlayer.createdAt, dateFormat)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography sx={styles.sectionTitle}>Active mod actions:</Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        padding: '0.75rem',
                                        border: '1px solid #4A5568',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    }}>
                                        {selectedPlayer.isMuted && (
                                            <Typography sx={{ color: '#ef5350', fontSize: '0.875rem', fontWeight: 600, mb: '5px' }}>
                                                Currently muted
                                            </Typography>
                                        )}
                                        {selectedPlayer.activeRename && (
                                            <Typography sx={{ color: '#ffd54f', fontSize: '0.875rem', fontWeight: 600 }}>
                                                Pending force rename
                                            </Typography>
                                        )}
                                        {selectedPlayer.activeReportingDisabledId && (
                                            <Typography sx={{ color: '#ef5350', fontSize: '0.875rem', fontWeight: 600 }}>
                                                Reporting disabled
                                            </Typography>
                                        )}
                                        {selectedPlayer.activeUsernameChangesBlockedId && (
                                            <Typography sx={{ color: '#ef5350', fontSize: '0.875rem', fontWeight: 600 }}>
                                                Username changes blocked
                                            </Typography>
                                        )}
                                        {!selectedPlayer.isMuted && !selectedPlayer.activeRename && !selectedPlayer.activeReportingDisabledId && !selectedPlayer.activeUsernameChangesBlockedId && (
                                            <Typography sx={{ color: '#9e9e9e', fontSize: '0.875rem', fontWeight: 600 }}>
                                                No active mod actions
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* Action Form */}
                    {selectedPlayer && (
                        <Box>
                            <Typography sx={styles.sectionTitle}>Submit Mod Action</Typography>
                            <ModActionForm
                                key={selectedPlayer.id}
                                target={modActionTargetFromPlayer(selectedPlayer)}
                                onSubmitted={handleActionSubmitted}
                                onError={setSearchError}
                            />
                        </Box>
                    )}
                </Box>

                {/* ==================== Right Column ==================== */}
                {selectedPlayer && (
                    <Box sx={styles.rightColumn}>
                        <Typography sx={styles.sectionTitle}>History</Typography>

                        {history.length === 0 ? (
                            <Typography sx={{ color: '#8C8C8C', fontSize: '0.875rem' }}>
                                No history for this user.
                            </Typography>
                        ) : (
                            <Box sx={styles.actionHistoryContainer}>
                                {history.map((entry) => {
                                    const isExpanded = expandedActionId === entry.id;

                                    // Standalone username change entry (forced renames are merged into their mod action)
                                    if (entry.kind === 'usernameChange' && entry.usernameChange) {
                                        const change = entry.usernameChange;
                                        const sourceLabel = getUsernameChangeSourceLabel(change.source);
                                        const isModDrivenChange = change.source === UsernameChangeSource.ForcedRename
                                            || change.source === UsernameChangeSource.UsernameChangedByModerator;
                                        return (
                                            <Box key={entry.id} sx={styles.actionHistoryItem}>
                                                <Box
                                                    sx={styles.actionHistoryHeader}
                                                    onClick={() => setExpandedActionId(isExpanded ? null : entry.id)}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                                        <ExpandMoreIcon
                                                            sx={{
                                                                color: 'white',
                                                                fontSize: '1.2rem',
                                                                mr: '0.5rem',
                                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s',
                                                            }}
                                                        />
                                                        <Typography sx={{ color: isModDrivenChange ? '#ffd54f' : 'white', fontSize: '0.85rem', mb:'0px' }}>
                                                            {getUsernameChangeLabel(change, dateFormat)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {isExpanded && (
                                                    <Box sx={styles.actionHistoryDetails}>
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                            {isModDrivenChange && (
                                                                <Box>
                                                                    <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                        Source
                                                                    </Typography>
                                                                    <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                        {sourceLabel}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    {change.previousUsername ? 'Name change' : 'Existing username'}
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatUsernameTransition(change)}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        );
                                    }

                                    const action = entry.modAction!;
                                    const status = getActionStatus(action, selectedPlayer);
                                    const isCancellable = (!action.cancelledAt
                                        && modActionDefinitions[action.actionType].cancellable
                                        && !(action.expiresAt && new Date(action.expiresAt) <= new Date()))
                                        || selectedPlayer.activeRename?.modActionId === action.id;

                                    return (
                                        <Box key={entry.id} sx={styles.actionHistoryItem}>
                                            {/* Header row */}
                                            <Box
                                                sx={styles.actionHistoryHeader}
                                                onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                                    <ExpandMoreIcon
                                                        sx={{
                                                            color: 'white',
                                                            fontSize: '1.2rem',
                                                            flexShrink: 0,
                                                            mr: '0.5rem',
                                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                            transition: 'transform 0.2s',
                                                        }}
                                                    />
                                                    <Typography sx={{ color: '#ffd54f', fontSize: '0.85rem', mb:'0px', minWidth: 0, overflowWrap: 'anywhere' }}>
                                                        {getModActionEntryLabel(entry, selectedPlayer, dateFormat)}
                                                    </Typography>
                                                    {status.label && (
                                                        <Typography sx={styles.statusBadge(status.color)}>
                                                            {status.label}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                {isCancellable && (
                                                    <Typography
                                                        sx={{ ...styles.cancelButton, ...(submitLoading ? { opacity: 0.5, pointerEvents: 'none' } : {}) }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCancelAction(action);
                                                        }}
                                                    >
                                                        Cancel
                                                    </Typography>
                                                )}
                                            </Box>

                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <Box sx={styles.actionHistoryDetails}>
                                                    {action.note && (
                                                        <Box sx={styles.userDetailRow}>
                                                            <Typography sx={{ color: '#81c784', fontSize: '0.75rem', fontWeight: 600, mb:'0px' }}>
                                                                Note:
                                                            </Typography>
                                                            <Typography sx={{ color: '#B0B0B0', fontSize: '0.75em' }}>
                                                                {action.note}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                                        <Box>
                                                            <Typography sx={{ color: '#8C8C8C', fontSize: '0.75rem', mb:'0px' }}>
                                                                Moderator Username:
                                                            </Typography>
                                                            <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                {action.moderatorUsername}
                                                            </Typography>
                                                        </Box>
                                                        {entry.mergedUsernameChange && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Name change
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatUsernameTransition(entry.mergedUsernameChange)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {action.startedAt && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Started
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatDate(action.startedAt, dateFormat)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {action.expiresAt && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Expires
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatDate(action.expiresAt, dateFormat)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {action.durationDays && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Time Left
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatDuration(action.durationDays)}
                                                                </Typography>
                                                            </Box>
                                                        )

                                                        }
                                                        {action.cancelledAt && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Cancelled
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatDate(action.cancelledAt, dateFormat)} by {action.cancelledByUsername}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                open={confirmDialog.open}
                title={confirmDialog.title}
                message={confirmDialog.message}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
                confirmButtonText={confirmDialog.confirmText || 'Confirm Action'}
                cancelButtonText="Go Back"
            />
        </Box>
    );
};

export default UserManagementTab;