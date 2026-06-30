import { IModerationAction } from '@/app/_contexts/UserTypes';
import {
    IModActionResponse,
    IPlayerSearchResult,
    IUsernameChangeResponse,
    ModActionType,
    UsernameChangeSource
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

export const getMuteDisplayText = (moderation?: IModerationAction): string | null => {
    if (!moderation?.endDate) return '';
    const timeDiff = new Date(moderation.endDate).getTime() - Date.now();

    // A small time difference can occur if the user doesn't change screens immediately after the mod action finishes
    // it used to say permanent mute hence why 'until next refresh' was added
    if (timeDiff <= 0){
        console.log('timeDiff became negative or 0');
        return 'until next refresh';
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
        return `${days} more day${days !== 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `${hours} more hour${hours !== 1 ? 's' : ''}`;
    } else {
        return `${minutes} more minute${minutes !== 1 ? 's' : ''}`;
    }
}

export const checkIfModerationExpired = (moderation: IModerationAction, updateModerationSeenStatus:(moderation: IModerationAction | null) => void ) =>{
    if (!moderation?.endDate) return;
    const timeDiff = new Date(moderation.endDate).getTime() - Date.now();
    if (timeDiff <= 0){
        updateModerationSeenStatus(null);
    }
}

export const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (durationDays?: number): string => {
    if (!durationDays) return '';
    if (durationDays % 7 === 0 && durationDays >= 7) return `${durationDays / 7} week${durationDays / 7 !== 1 ? 's' : ''}`;
    return `${durationDays} day${durationDays !== 1 ? 's' : ''}`;
};

export const getActionLabel = (action: IModActionResponse): string => {
    const date = formatDate(action.createdAt);
    switch (action.actionType) {
        case ModActionType.Mute:
            return `${date} Muted (${formatDuration(action.durationDays)})`;
        case ModActionType.Warning:
            return `${date} Warning`;
        case ModActionType.Rename:
            return `${date} Renamed`;
        default:
            return `${date} ${action.actionType}`;
    }
};

export const getActionStatus = (action: IModActionResponse, selectedPlayer:IPlayerSearchResult): { label: string; color: string } => {
    if (action.cancelledAt) {
        return { label: 'Cancelled', color: '#9E9E9E' };
    }
    if (action.actionType === ModActionType.Mute) {
        if (!action.startedAt) {
            return { label: 'Pending', color: '#ffd54f' };
        }
        if (action.expiresAt && new Date(action.expiresAt) <= new Date()) {
            return { label: 'Expired', color: '#9E9E9E' };
        }
        return { label: 'Active', color: '#ef5350' };
    }
    if (action.actionType === ModActionType.Rename) {
        if(selectedPlayer.activeRename?.id === action.id){
            return { label: 'Pending', color: '#ffd54f' };
        }
    }
    return { label: '', color: '#9E9E9E' };
};

/**
 * Formats a username transition for display, e.g. "oldName → newName".
 * Initial records (no previous username) just show the new name.
 */
export const formatUsernameTransition = (change: IUsernameChangeResponse): string => {
    if (!change.previousUsername) {
        return change.newUsername;
    }
    return `${change.previousUsername} → ${change.newUsername}`;
};

export const getUsernameChangeLabel = (change: IUsernameChangeResponse): string => {
    const date = formatDate(change.createdAt);
    switch (change.source) {
        case UsernameChangeSource.AccountCreation:
            return `${date} Account created (${change.newUsername})`;
        case UsernameChangeSource.Migration:
            return `${date} Pre-existing username (${change.newUsername})`;
        case UsernameChangeSource.ForcedRename:
            return `${date} Force Rename: ${formatUsernameTransition(change)}`;
        case UsernameChangeSource.UserInitiated:
        default:
            return `${date} Renamed: ${formatUsernameTransition(change)}`;
    }
};

export const getUsernameChangeSourceLabel = (source: UsernameChangeSource): string => {
    switch (source) {
        case UsernameChangeSource.AccountCreation:
            return 'Account creation';
        case UsernameChangeSource.Migration:
            return 'Migration';
        case UsernameChangeSource.ForcedRename:
            return 'Forced rename';
        default:
            return 'User-initiated';
    }
};

/**
 * A unified history entry that is either a mod action or a standalone username change.
 * Forced renames are merged into their related Rename mod action via `mergedUsernameChange`.
 */
export interface IUserHistoryEntry {
    id: string;
    createdAt: string;
    kind: 'modAction' | 'usernameChange';
    modAction?: IModActionResponse;
    usernameChange?: IUsernameChangeResponse;
    mergedUsernameChange?: IUsernameChangeResponse;
}

/**
 * Builds a single chronological history list from mod actions and username changes.
 * A ForcedRename username change is deduped into its related Rename mod action entry
 * (so the forced rename and its resulting name change render as one row).
 */
export const buildUserHistory = (
    modActions: IModActionResponse[],
    usernameChanges: IUsernameChangeResponse[],
): IUserHistoryEntry[] => {
    const forcedByModActionId = new Map<string, IUsernameChangeResponse>();
    for (const change of usernameChanges) {
        if (change.source === UsernameChangeSource.ForcedRename && change.relatedModActionId) {
            forcedByModActionId.set(change.relatedModActionId, change);
        }
    }

    const consumedChangeIds = new Set<string>();
    const entries: IUserHistoryEntry[] = [];

    for (const action of modActions) {
        const merged = forcedByModActionId.get(action.id);
        if (merged) {
            consumedChangeIds.add(merged.id);
        }
        entries.push({
            id: action.id,
            createdAt: action.createdAt,
            kind: 'modAction',
            modAction: action,
            mergedUsernameChange: merged,
        });
    }

    for (const change of usernameChanges) {
        if (consumedChangeIds.has(change.id)) {
            continue;
        }
        entries.push({
            id: change.id,
            createdAt: change.createdAt,
            kind: 'usernameChange',
            usernameChange: change,
        });
    }

    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return entries;
};

/**
 * Builds the header label for a mod action history entry.
 * Force renames are distinguished from user renames, and a resolved force rename
 * (one with a merged username change) reads differently from a pending one.
 */
export const getModActionEntryLabel = (entry: IUserHistoryEntry, currentUsername: string): string => {
    const action = entry.modAction!;
    const date = formatDate(action.createdAt);
    if (action.actionType === ModActionType.Rename) {
        if (entry.mergedUsernameChange) {
            return `${date} Force Rename (resolved): ${formatUsernameTransition(entry.mergedUsernameChange)}`;
        }
        // Pending: the user hasn't renamed yet, so their current username is the name being forced out.
        return `${date} Force Rename: '${currentUsername}'`;
    }
    return getActionLabel(action);
};