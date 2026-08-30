'use client';

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { IServerSettings } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

/** How often to re-check the server for settings changes. */
const POLL_INTERVAL_MS = 20000;

/**
 * Consecutive failures tolerated before treating games as disabled. Two rather than one, so a
 * single transient blip doesn't briefly flash the maintenance UI at everyone.
 */
const FAILURES_BEFORE_DISABLING = 2;

export const DEFAULT_MAINTENANCE_MESSAGE = 'Karabast is currently under maintenance. Be back soon!';

interface IServerSettingsContext {

    /**
     * Whether new games can be created. False until the server says otherwise, so a backend that has
     * gone unreachable reads as maintenance rather than letting players start games that would fail.
     * On its own it also reads as maintenance during the first request of every page load, which is
     * what `hasLoaded` is for.
     */
    gamesEnabled: boolean;
    maintenanceMessage: string;

    /**
     * False until the first response arrives. Gate maintenance UI on this as well as `gamesEnabled`,
     * so a page load shows the normal view while that first request is in flight instead of flashing
     * maintenance at every visitor. The server rejects a game started in that window with a 503, so
     * the client-side gate is presentation rather than enforcement.
     */
    hasLoaded: boolean;
    refreshServerSettings: () => Promise<void>;
}

const ServerSettingsContext = createContext<IServerSettingsContext | undefined>(undefined);

export const ServerSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<IServerSettings | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const consecutiveFailures = useRef(0);

    const refreshServerSettings = useCallback(async () => {
        try {
            const fetched = await ServerApiService.getServerSettingsAsync();
            consecutiveFailures.current = 0;
            setSettings(fetched);
        } catch {
            consecutiveFailures.current += 1;
            if (consecutiveFailures.current >= FAILURES_BEFORE_DISABLING) {
                setSettings(null);
            }
        } finally {
            setHasLoaded(true);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        const poll = async () => {
            if (cancelled) return;
            await refreshServerSettings();
        };

        void poll();

        // Deliberately runs for as long as the page is open. The home page's other pollers wind
        // themselves down after ~10 minutes, which would leave an idle tab unaware that maintenance
        // had been switched on. This endpoint is served from an in-memory cache, so polling is cheap.
        const intervalId = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [refreshServerSettings]);

    const value = useMemo<IServerSettingsContext>(() => ({
        gamesEnabled: settings?.gamesEnabled ?? false,
        maintenanceMessage: settings?.maintenanceMessage || DEFAULT_MAINTENANCE_MESSAGE,
        hasLoaded,
        refreshServerSettings,
    }), [settings, hasLoaded, refreshServerSettings]);

    return (
        <ServerSettingsContext.Provider value={value}>
            {children}
        </ServerSettingsContext.Provider>
    );
};

export const useServerSettings = (): IServerSettingsContext => {
    const context = useContext(ServerSettingsContext);
    if (!context) {
        throw new Error('useServerSettings must be used within a ServerSettingsProvider');
    }
    return context;
};
