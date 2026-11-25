import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AlertTitle, Box, Divider, Typography } from '@mui/material';
import { ServerApiError, ServerApiService } from '@/app/_services/ServerApiService';
import {
    FeatureFlagUpdate,
    IFeatureFlagState,
    IPlayerSearchResult,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { FeatureFlag } from '@/app/_constants/constants';
import FeatureFlagCard from './FeatureFlagCard';

const FeatureFlagsTab: React.FC = () => {
    const [flags, setFlags] = useState<IFeatureFlagState[] | null>(null);
    const [isUnavailable, setIsUnavailable] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [saveErrors, setSaveErrors] = useState<Partial<Record<FeatureFlag, string>>>({});

    // usernames found by looking players up, keyed by user id; null for an id with no account
    const [lookedUpUsernames, setLookedUpUsernames] = useState<Record<string, string | null>>({});
    const requestedLookups = useRef(new Set<string>());
    const latestChange = useRef<Partial<Record<FeatureFlag, number>>>({});

    const loadFlags = useCallback(async () => {
        try {
            setFlags(await ServerApiService.getFeatureFlagsAsync());
            setIsUnavailable(false);
            setLoadError(null);
        } catch (error) {
            // the server answers 503 when it has no database, as on a local dev server
            if (error instanceof ServerApiError && error.status === 503) {
                setIsUnavailable(true);
            } else {
                setLoadError(error instanceof Error ? error.message : 'Failed to load feature flags');
            }
        }
    }, []);

    useEffect(() => {
        void loadFlags();
    }, [loadFlags]);

    // TODO: remove the lookup once the server sends `users` with every flag
    useEffect(() => {
        const unnamed = (flags ?? []).flatMap((flag) =>
            flag.userIds.filter((id) => !flag.users?.some((user) => user.id === id))
        );

        for (const id of new Set(unnamed)) {
            if (requestedLookups.current.has(id)) {
                continue;
            }
            requestedLookups.current.add(id);

            ServerApiService.findUserAsync(id)
                .then(({ players }) => {
                    const username = players.find((player) => player.id === id)?.username ?? null;
                    setLookedUpUsernames((current) => ({ ...current, [id]: username }));
                })
                .catch(() => {
                    // the chip keeps showing the id; let a later load try again
                    requestedLookups.current.delete(id);
                });
        }
    }, [flags]);

    const usernameOf = (flag: IFeatureFlagState) => (userId: string) => {
        const sent = flag.users?.find((user) => user.id === userId);
        return sent ? sent.username : lookedUpUsernames[userId];
    };

    const clearSaveError = (flagName: FeatureFlag) => {
        setSaveErrors((current) => {
            const remaining = { ...current };
            delete remaining[flagName];
            return remaining;
        });
    };

    const updateFlag = async (flagName: FeatureFlag, updates: FeatureFlagUpdate) => {
        const change = (latestChange.current[flagName] ?? 0) + 1;
        latestChange.current[flagName] = change;
        clearSaveError(flagName);

        // show the change straight away; the server's reply replaces it
        setFlags((current) => current?.map((flag) => (flag.flag === flagName ? { ...flag, ...updates } : flag)) ?? current);

        try {
            const updated = await ServerApiService.updateFeatureFlagAsync(flagName, updates);
            // an earlier reply arriving after a later change would undo that change on screen
            if (latestChange.current[flagName] === change) {
                setFlags((current) => current?.map((flag) => (flag.flag === flagName ? updated : flag)) ?? current);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save the change';
            setSaveErrors((current) => ({ ...current, [flagName]: `Couldn't save the change: ${message}. Reloaded the flag as the server has it.` }));
            void loadFlags();
        }
    };

    const addPlayer = (flag: IFeatureFlagState, player: IPlayerSearchResult) => {
        // the search already knows the name, so this player never needs looking up
        requestedLookups.current.add(player.id);
        setLookedUpUsernames((current) => ({ ...current, [player.id]: player.username }));

        if (!flag.userIds.includes(player.id)) {
            void updateFlag(flag.flag, { userIds: [...flag.userIds, player.id] });
        }
    };

    // ======================== STYLES ========================
    const styles = {
        container: {
            maxWidth: '880px',
        },
        hint: {
            color: '#9A9A9A',
            fontSize: '0.9rem',
            mb: '1.25rem',
        },
    };

    return (
        <Box sx={styles.container}>
            <Typography variant={'h3'}>Feature Flags</Typography>
            <Divider sx={{ mb: '14px' }} />
            <Typography sx={styles.hint}>
                Who each server feature is on for. A change takes effect on the player&apos;s next request.
            </Typography>

            {loadError && <Alert severity="error" sx={{ mb: '1rem' }}>{loadError}</Alert>}

            {isUnavailable && (
                <Alert severity="info">
                    <AlertTitle>Feature flags need a database</AlertTitle>
                    This server has no database connection, so every flag is on for everyone and none can be changed.
                </Alert>
            )}

            {flags?.map((flag) => (
                <FeatureFlagCard
                    key={flag.flag}
                    flag={flag}
                    saveError={saveErrors[flag.flag]}
                    usernameOf={usernameOf(flag)}
                    onChange={(updates) => void updateFlag(flag.flag, updates)}
                    onAddPlayer={(player) => addPlayer(flag, player)}
                />
            ))}
        </Box>
    );
};

export default FeatureFlagsTab;
