'use client';
import React, { useState } from 'react';
import {
    Box,
    Typography,
    MenuItem,
    Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { ServerApiService } from '@/app/_services/ServerApiService';
import {
    IModActionResponse,
    IPlayerSearchResult,
    ModActionType,
    DurationUnit
} from "@/app/_components/_sharedcomponents/Preferences/Preferences.types";
import ConfirmationDialog from "@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog";
import {formatDate, getActionLabel, getActionStatus} from "@/app/_utils/ModerationUtils";

const PERMANENT_DURATION_DAYS = 36500;

const UserManagementTab: React.FC = () => {
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Player state
    const [players, setPlayers] = useState<IPlayerSearchResult[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<IPlayerSearchResult | null>(null);
    const [modActions, setModActions] = useState<IModActionResponse[]>([]);

    // Action form state
    const [actionType, setActionType] = useState<ModActionType>(ModActionType.Mute);
    const [durationValue, setDurationValue] = useState<string>('');
    const [durationUnit, setDurationUnit] = useState<DurationUnit>(DurationUnit.Days);
    const [note, setNote] = useState('');

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
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearchLoading(true);
        setSearchError(null);
        setSelectedPlayer(null);
        setModActions([]);
        setPlayers([]);
        setSuccessMessage(null);

        try {
            const result = await ServerApiService.findUserAsync(searchQuery.trim());
            setPlayers(result.players);
            setModActions(result.modActions || []);

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
            } catch (error) {
                console.error('Failed to fetch mod actions:', error);
            }
        }
    };

    const getDurationInDays = (): number => {
        if (durationUnit === DurationUnit.Permanent) return PERMANENT_DURATION_DAYS;
        const value = parseInt(durationValue);
        if (!value || value <= 0) return 0;
        return durationUnit === DurationUnit.Weeks ? value * 7 : value;
    };

    const handleSubmitAction = () => {
        if (!selectedPlayer) return;

        const durationDays = getDurationInDays();
        if (actionType === ModActionType.Mute && !durationDays) return;

        const durationDisplay = durationUnit === DurationUnit.Permanent
            ? 'permanently'
            : `for ${durationValue} ${durationUnit.toLowerCase()}`;

        const actionMessages: Record<ModActionType, string> = {
            [ModActionType.Mute]: `This will mute player ${selectedPlayer.username} ${durationDisplay}. Are you sure?`,
            [ModActionType.Warning]: `This will issue a warning to player ${selectedPlayer.username}. Are you sure?`,
            [ModActionType.Rename]: `This will force player ${selectedPlayer.username} to rename. Are you sure?`,
        };

        setConfirmDialog({
            open: true,
            title: 'Mod Action',
            message: actionMessages[actionType],
            confirmText: 'Confirm Action',
            onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                setSubmitLoading(true);
                try {
                    // Refresh mod actions
                    const result = await ServerApiService.submitModActionAsync(
                        selectedPlayer.id,
                        actionType,
                        note.trim(),
                        actionType === ModActionType.Mute ? durationDays : undefined,
                    );
                    const refreshed = await ServerApiService.getModActionsForPlayerAsync(selectedPlayer.id);
                    setModActions(refreshed.modActions || []);
                    setNote('');
                    setDurationValue('');
                    setDurationUnit(DurationUnit.Days);
                    setSuccessMessage(result.message);
                } catch (error) {
                    setSearchError(error instanceof Error ? error.message : 'Failed to submit action');
                } finally {
                    setSubmitLoading(false);
                }
            },
        });
    };

    const handleCancelAction = (action: IModActionResponse) => {
        if (!selectedPlayer) return;

        setConfirmDialog({
            open: true,
            title: 'Mod Action',
            message: `Are you sure you wish to cancel this mod action?`,
            confirmText: 'Confirm Action',
            onConfirm: async () => {
                setConfirmDialog((prev) => ({ ...prev, open: false }));
                setSubmitLoading(true);
                try {
                    await ServerApiService.cancelModActionAsync(selectedPlayer.id, action.id);
                    // Refresh mod actions
                    const refreshed = await ServerApiService.getModActionsForPlayerAsync(selectedPlayer.id);
                    setModActions(refreshed.modActions || []);
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

    const canSubmit = selectedPlayer
        && (actionType !== ModActionType.Mute || getDurationInDays() > 0);

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
        actionFormRow: {
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
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
        }),
        cancelButton: {
            color: '#ef5350',
            fontSize: '0.75rem',
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
            bgcolor: "rgba(0, 0, 0, 0.2)",
            color: 'red',
            fontSize: '0.775rem',
        }
    };

    // ==================== Render ====================
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
                        <Typography sx={styles.sectionTitle}>Find user</Typography>
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
                            <Typography sx={styles.sectionTitle}>Multiple players found</Typography>
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
                                            <Typography sx={{ color: 'white', fontSize: '0.875rem'  }}>
                                                {formatDate(player.lastLogin)}
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
                            <Typography sx={styles.sectionTitle}>User details</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Username:</Typography>
                                    <Typography sx={styles.userDetailValue}>{selectedPlayer.username}</Typography>
                                </Box>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Player ID:</Typography>
                                    <Typography sx={{ ...styles.userDetailValue, fontSize: '0.75rem', color: '#B0B0B0' }}>
                                        {selectedPlayer.id}
                                    </Typography>
                                </Box>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Last login:</Typography>
                                    <Typography sx={styles.userDetailValue}>
                                        {formatDate(selectedPlayer.lastLogin)}
                                    </Typography>
                                </Box>
                                <Box sx={styles.userDetailRow}>
                                    <Typography sx={styles.userDetailLabel}>Created:</Typography>
                                    <Typography sx={styles.userDetailValue}>
                                        {formatDate(selectedPlayer.createdAt)}
                                    </Typography>
                                </Box>
                                {selectedPlayer.isMuted && (
                                    <Box sx={styles.userDetailRow}>
                                        <Typography sx={{ color: '#ef5350', fontSize: '0.875rem', fontWeight: 600 }}>
                                            Currently muted
                                        </Typography>
                                    </Box>
                                )}
                                {selectedPlayer.needsRename && (
                                    <Box sx={styles.userDetailRow}>
                                        <Typography sx={{ color: '#ffd54f', fontSize: '0.875rem', fontWeight: 600 }}>
                                            Pending force rename
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}

                    {/* Action Form */}
                    {selectedPlayer && (
                        <Box>
                            <Typography sx={styles.sectionTitle}>Submit mod action</Typography>

                            {/* Action type selector */}
                            <Box sx={{ ...styles.actionFormRow, mb: '0.75rem' }}>
                                <StyledTextField
                                    select
                                    label="Action type"
                                    value={actionType}
                                    onChange={(e) => setActionType(e.target.value as ModActionType)}
                                    size="small"
                                    sx={{ minWidth: '160px' }}
                                >
                                    <MenuItem value={ModActionType.Warning}>Warning</MenuItem>
                                    <MenuItem value={ModActionType.Rename}>Force Rename</MenuItem>
                                    <MenuItem value={ModActionType.Mute}>Mute</MenuItem>
                                </StyledTextField>

                                {/* Duration - only for Mute */}
                                {actionType === ModActionType.Mute && (
                                    <>
                                        <StyledTextField
                                            select
                                            label="Duration"
                                            value={durationUnit}
                                            onChange={(e) => {
                                                setDurationUnit(e.target.value as DurationUnit);
                                                if (e.target.value === DurationUnit.Permanent) {
                                                    setDurationValue('');
                                                }
                                            }}
                                            size="small"
                                            sx={{ minWidth: '30px', maxWidth:'150px' }}
                                        >
                                            <MenuItem value={DurationUnit.Days}>Days</MenuItem>
                                            <MenuItem value={DurationUnit.Weeks}>Weeks</MenuItem>
                                            <MenuItem value={DurationUnit.Permanent}>Permanent</MenuItem>
                                        </StyledTextField>

                                        {durationUnit !== DurationUnit.Permanent && (
                                            <StyledTextField
                                                label={durationUnit === DurationUnit.Weeks ? 'Weeks' : 'Days'}
                                                type="number"
                                                value={durationValue}
                                                onChange={(e) => setDurationValue(e.target.value)}
                                                size="small"
                                                sx={{ width: '300px' }}
                                                inputProps={{ min: 1 }}
                                            />
                                        )}
                                    </>
                                )}

                                <PreferenceButton
                                    variant="concede"
                                    text={submitLoading ? '' : actionType}
                                    buttonFnc={handleSubmitAction}
                                    disabled={!canSubmit || submitLoading}
                                />
                            </Box>

                            {/* Notes */}
                            <Typography sx={{ ...styles.sectionTitle, mt: '0.75rem' }}>Moderator notes for action</Typography>
                            <StyledTextField
                                placeholder="Notes about the action"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                multiline
                                rows={3}
                                size="small"
                            />
                        </Box>
                    )}
                </Box>

                {/* ==================== Right Column ==================== */}
                {selectedPlayer && (
                    <Box sx={styles.rightColumn}>
                        <Typography sx={styles.sectionTitle}>Previous mod actions</Typography>

                        {modActions.length === 0 ? (
                            <Typography sx={{ color: '#8C8C8C', fontSize: '0.875rem' }}>
                                No previous mod actions for this user.
                            </Typography>
                        ) : (
                            <Box sx={styles.actionHistoryContainer}>
                                {modActions.map((action) => {
                                    const status = getActionStatus(action);
                                    const isExpanded = expandedActionId === action.id;
                                    const isCancellable = !action.cancelledAt
                                        && action.actionType !== ModActionType.Warning
                                        && !(action.expiresAt && new Date(action.expiresAt) <= new Date());

                                    return (
                                        <Box key={action.id} sx={styles.actionHistoryItem}>
                                            {/* Header row */}
                                            <Box
                                                sx={styles.actionHistoryHeader}
                                                onClick={() => setExpandedActionId(isExpanded ? null : action.id)}
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
                                                    <Typography sx={{ color: 'white', fontSize: '0.85rem', mb:'0px' }}>
                                                        {getActionLabel(action)}
                                                    </Typography>
                                                    {status.label && (
                                                        <Typography sx={styles.statusBadge(status.color)}>
                                                            {status.label}
                                                        </Typography>
                                                    )}
                                                </Box>

                                                {isCancellable && (
                                                    <Typography
                                                        sx={styles.cancelButton}
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
                                                                Moderator ID:
                                                            </Typography>
                                                            <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                {action.moderatorId}
                                                            </Typography>
                                                        </Box>
                                                        {action.startedAt && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Started
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatDate(action.startedAt)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {action.expiresAt && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Expires
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatDate(action.expiresAt)}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                        {action.cancelledAt && (
                                                            <Box>
                                                                <Typography sx={{ color: '#8C8C8C', fontSize: '0.7rem', mb:'0px' }}>
                                                                    Cancelled
                                                                </Typography>
                                                                <Typography sx={{ color: '#B0B0B0', fontSize: '0.75rem' }}>
                                                                    {formatDate(action.cancelledAt)} by {action.cancelledBy}
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
                cancelButtonText="Cancel Action"
            />
        </Box>
    );
};

export default UserManagementTab;