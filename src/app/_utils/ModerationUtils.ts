import { IModerationAction, IUser } from '@/app/_contexts/UserTypes';
import {
    IModActionResponse, ModActionType
} from "@/app/_components/_sharedcomponents/Preferences/Preferences.types";

const PERMANENT_DURATION_DAYS = 36500;

export const getMuteDisplayText = (moderation?: IModerationAction): string | null => {
    if (!moderation?.endDate) return '';
    const timeDiff = new Date(moderation.endDate).getTime() - Date.now();

    // A small time difference can occur if the user doesn't change screens immediately after the mod action finishes
    // it used to stay permanent mute hence why 'until next refresh' was added
    if (timeDiff <= 0){
        console.log('timeDiff became negative or 0');
        return 'until next refresh';
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    if (days >= PERMANENT_DURATION_DAYS/2) {
        return null;
    }

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
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const formatDuration = (durationDays?: number): string => {
    if (!durationDays) return '';
    if (durationDays >= PERMANENT_DURATION_DAYS/2) return 'Permanent';
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

export const getActionStatus = (action: IModActionResponse): { label: string; color: string } => {
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
    return { label: '', color: '#9E9E9E' };
};