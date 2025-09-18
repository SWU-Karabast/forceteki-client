// Add this helper method to your User classes or create a utility function
import { IModeration } from '@/app/_contexts/UserTypes';

export const getMuteDisplayText = (moderation?: IModeration): string => {
    if (!moderation?.startDays || !moderation?.days) return '';

    const timeDiff = (() => {
        const end = new Date(moderation.startDays);
        return end.setTime(end.getTime() + moderation.days * 24 * 60 * 60 * 1000) - Date.now();
    })();

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