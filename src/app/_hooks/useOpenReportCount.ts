import { useCallback, useEffect, useState } from 'react';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { OPEN_REPORT_COUNT_POLL_MS } from '@/app/_utils/playerReportUtils';

/**
 * Number of open player reports for the mod tools badges, refreshed periodically.
 * `refresh` re-fetches immediately, e.g. after a ticket was closed. Null until the first load succeeds.
 */
export const useOpenReportCount = (): { openCount: number | null; refresh: () => void } => {
    const [openCount, setOpenCount] = useState<number | null>(null);

    const refresh = useCallback(async () => {
        try {
            setOpenCount(await ServerApiService.getOpenPlayerReportCountAsync());
        } catch (error) {
            // Keep the last known count; the next poll retries
            console.error('Failed to load open report count:', error);
        }
    }, []);

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, OPEN_REPORT_COUNT_POLL_MS);
        return () => clearInterval(interval);
    }, [refresh]);

    return { openCount, refresh };
};
