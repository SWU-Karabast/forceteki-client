import React, { useState } from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { IModActionResponse, ModActionType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDate } from '@/app/_utils/ModerationUtils';
import { describeModAction } from '@/app/_utils/playerReportUtils';

/** Newest penalties listed in the tooltip; the full history is in the ticket and in Find User */
const MAX_LISTED = 5;

/**
 * Mod actions per player, loaded the first time someone hovers over them. Shared by every row, since the same
 * players show up in many reports; {@link forgetPlayerPenalties} drops an entry after an action against them.
 */
const penaltyCache = new Map<string, Promise<IModActionResponse[]>>();

export const forgetPlayerPenalties = (playerId: string): void => {
    penaltyCache.delete(playerId);
};

const loadPenaltiesAsync = (playerId: string): Promise<IModActionResponse[]> => {
    let cached = penaltyCache.get(playerId);
    if (!cached) {
        cached = ServerApiService.getModActionsForPlayerAsync(playerId)
            .then((result) => (result.modActions ?? []).filter((action) => action.playerId === playerId))
            .catch((error) => {
                // Not cached, so the next hover tries again
                penaltyCache.delete(playerId);
                throw error;
            });
        penaltyCache.set(playerId, cached);
    }
    return cached;
};

const isActive = (action: IModActionResponse): boolean => {
    if (action.cancelledAt) {
        return false;
    }
    if (action.actionType === ModActionType.Mute) {
        return !action.expiresAt || new Date(action.expiresAt) > new Date();
    }
    return action.actionType === ModActionType.ReportingDisabled || action.actionType === ModActionType.UsernameChangesBlocked;
};

interface IPlayerPenaltyTooltipProps {
    playerId: string;
    username: string;
    children: React.ReactElement;
}

/**
 * Hovering a player in the report list shows the penalties they already received, newest first, in short form.
 */
const PlayerPenaltyTooltip: React.FC<IPlayerPenaltyTooltipProps> = ({ playerId, username, children }) => {
    const dateFormat = useDateFormat();
    const [state, setState] = useState<{ status: 'idle' | 'loading' | 'loaded' | 'failed'; actions: IModActionResponse[] }>({ status: 'idle', actions: [] });

    const handleOpen = async () => {
        setState((current) => ({ ...current, status: current.status === 'loaded' ? 'loaded' : 'loading' }));
        try {
            const actions = await loadPenaltiesAsync(playerId);
            setState({ status: 'loaded', actions: [...actions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
        } catch {
            setState({ status: 'failed', actions: [] });
        }
    };

    // ----------------Styles----------------//
    const styles = {
        title: {
            fontSize: '0.8rem',
            fontWeight: 700,
            mb: '0.25rem',
        },
        line: {
            fontSize: '0.75rem',
            mb: 0,
        },
        active: {
            color: '#ef9a9a',
            fontWeight: 700,
        },
        muted: {
            color: '#B0B0B0',
            fontSize: '0.75rem',
            mb: 0,
        },
    };

    const renderContent = () => {
        if (state.status === 'failed') {
            return <Typography sx={styles.muted}>Could not load the penalties.</Typography>;
        }
        if (state.status !== 'loaded') {
            return <Typography sx={styles.muted}>Loading…</Typography>;
        }
        if (state.actions.length === 0) {
            return <Typography sx={styles.muted}>No penalties so far.</Typography>;
        }
        return (
            <>
                {state.actions.slice(0, MAX_LISTED).map((action) => (
                    <Typography key={action.id} sx={styles.line}>
                        {formatDate(action.createdAt, dateFormat)} · {describeModAction(action)}
                        {action.cancelledAt && <Box component="span" sx={{ color: '#9E9E9E' }}> (cancelled)</Box>}
                        {isActive(action) && <Box component="span" sx={styles.active}> (active)</Box>}
                    </Typography>
                ))}
                {state.actions.length > MAX_LISTED && <Typography sx={styles.muted}>+{state.actions.length - MAX_LISTED} more</Typography>}
            </>
        );
    };

    return (
        <Tooltip
            title={(
                <Box>
                    <Typography sx={styles.title}>Penalties of {username}</Typography>
                    {renderContent()}
                </Box>
            )}
            placement="bottom-start"
            enterDelay={400}
            onOpen={handleOpen}
        >
            {children}
        </Tooltip>
    );
};

export default PlayerPenaltyTooltip;
