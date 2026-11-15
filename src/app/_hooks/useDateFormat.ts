import { useMemo } from 'react';
import { useUser } from '@/app/_contexts/User.context';
import { DateFormat } from '@/app/_contexts/UserTypes';
import { getDateFormat } from '@/app/_utils/dateFormatUtils';
import { loadPreferencesFromLocalStorage } from '@/app/_utils/ServerAndLocalStorageUtils';

/**
 * The viewer's preferred date format: from the server preferences when logged in,
 * otherwise from localStorage (anonymous users), otherwise the default.
 */
export const useDateFormat = (): DateFormat => {
    const { user } = useUser();

    return useMemo(() => {
        if (user?.preferences?.gameOptions?.dateFormat) {
            return user.preferences.gameOptions.dateFormat;
        }
        return getDateFormat(loadPreferencesFromLocalStorage());
    }, [user]);
};
