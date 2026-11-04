import { IModActionResponse, IPlayerSearchResult } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';

/** A player's account and the mod actions against them, as the mod tools last loaded them */
export interface IPlayerModeration {

    /** Null for players without an account */
    player: IPlayerSearchResult | null;
    modActions: IModActionResponse[];
}

/**
 * Loaded per player on first use and shared by every view of the report queue, since the same players show up in
 * many reports. Every mod action and cancellation drops the player's entry (see modActionSubmission), so a view
 * never shows penalties from before an action, wherever the action was issued.
 */
const cache = new Map<string, Promise<IPlayerModeration>>();

export const forgetPlayerModeration = (playerId: string): void => {
    cache.delete(playerId);
};

/** @param fresh skips a cached entry, for decisions that must not rely on an older load (e.g. which actions to offer) */
export const loadPlayerModerationAsync = (playerId: string, fresh = false): Promise<IPlayerModeration> => {
    if (fresh) {
        cache.delete(playerId);
    }
    let cached = cache.get(playerId);
    if (!cached) {
        cached = ServerApiService.getModActionsForPlayerAsync(playerId)
            .then((result) => ({
                player: (result.players ?? []).find((player) => player.id === playerId) ?? null,
                modActions: (result.modActions ?? []).filter((action) => action.playerId === playerId),
            }))
            .catch((error) => {
                // Not cached, so the next use tries again
                cache.delete(playerId);
                throw error;
            });
        cache.set(playerId, cached);
    }
    return cached;
};
