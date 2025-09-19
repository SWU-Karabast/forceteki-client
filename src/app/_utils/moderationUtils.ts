import { IModerationAction } from '@/app/_contexts/UserTypes';

export const getMuteDisplayText = (moderation?: IModerationAction): string | null => {
    if (!moderation?.endDate) return '';
    const timeDiff = new Date(moderation.endDate).getTime() - Date.now();

    if (timeDiff <= 0){
        console.log('timeDiff became negative or 0');
        return null;
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

export const checkModerationStatus = (moderationActionChangeFunction: (moderation: IModerationAction | null) => void, moderationAction?: IModerationAction) => {
    if(!moderationAction?.endDate) return;

    const timeDiff = new Date(moderationAction.endDate).getTime() - Date.now();
    if(timeDiff <= 0) moderationActionChangeFunction(null);
}