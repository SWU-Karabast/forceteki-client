import { IModerationAction } from '@/app/_contexts/UserTypes';

export const getMuteDisplayText = (moderation?: IModerationAction): string => {
    if (!moderation?.endDate) return '';

    const timeDiff = new Date(moderation.endDate).getTime() - Date.now();

    // If expired, return empty string
    if (timeDiff <= 0) return '';

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