import { IModerationAction, IUser } from '@/app/_contexts/UserTypes';

// List of allowed usernames for mod access
const allowedModUsers = ['Veld', 'SWUPetranaki', 'CheBato'];

export const isMod = (user: IUser): boolean => {
    return Boolean(user.username && allowedModUsers.includes(user.username));
};

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

export const checkIfModerationExpired = (moderation: IModerationAction, updateModerationSeenStatus:(moderation: IModerationAction | null) => void ) =>{
    if (!moderation?.endDate) return;
    const timeDiff = new Date(moderation.endDate).getTime() - Date.now();
    if (timeDiff <= 0){
        updateModerationSeenStatus(null);
    }
}