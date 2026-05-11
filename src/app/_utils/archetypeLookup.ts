import { useEffect, useState } from 'react';
import { IBaseTypeOption } from '@/app/_constants/constants';
import {
    baseTypeDisplayName,
    LeaderOption,
    leaderLabel,
} from '@/app/_components/_sharedcomponents/OpponentPreferences/utils';

export interface IArchetypeLookup {
    leaders: LeaderOption[];
    baseTypes: IBaseTypeOption[];
    leaderById: Map<string, LeaderOption>;
    baseTypesByJoinedIds: Map<string, IBaseTypeOption>;
}

let cache: IArchetypeLookup | null = null;
let inflight: Promise<IArchetypeLookup> | null = null;

async function loadOnce(): Promise<IArchetypeLookup> {
    if (cache) {
        return cache;
    }
    if (!inflight) {
        inflight = (async () => {
            const [leadersRes, baseTypesRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-leaders`),
                fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-base-types`),
            ]);
            if (!leadersRes.ok || !baseTypesRes.ok) {
                throw new Error(`Failed to load leaders/base types (${leadersRes.status}/${baseTypesRes.status})`);
            }
            const leaders: LeaderOption[] = await leadersRes.json();
            const baseTypes: IBaseTypeOption[] = await baseTypesRes.json();
            leaders.sort((a, b) => leaderLabel(a).localeCompare(leaderLabel(b)));
            baseTypes.sort((a, b) => {
                const aspectCmp = (a.aspects ?? []).join('+').localeCompare((b.aspects ?? []).join('+'));
                if (aspectCmp !== 0) return aspectCmp;
                return baseTypeDisplayName(a).localeCompare(baseTypeDisplayName(b));
            });
            const leaderById = new Map(leaders.map((l) => [l.id, l]));
            const baseTypesByJoinedIds = new Map<string, IBaseTypeOption>();
            for (const bt of baseTypes) {
                baseTypesByJoinedIds.set(bt.baseIds.slice().sort().join('|'), bt);
            }
            cache = { leaders, baseTypes, leaderById, baseTypesByJoinedIds };
            return cache;
        })();
    }
    return inflight;
}

/**
 * Shared, app-wide lookup of leaders + base types for rendering archetype
 * filter rules. First caller triggers the fetch; subsequent callers reuse
 * the cached maps.
 */
export function useArchetypeLookup(): IArchetypeLookup | null {
    const [data, setData] = useState<IArchetypeLookup | null>(cache);
    useEffect(() => {
        if (data) return;
        let cancelled = false;
        loadOnce().then((result) => {
            if (!cancelled) setData(result);
        }).catch(() => {
            // swallow; consumers fall back to ids
        });
        return () => {
            cancelled = true;
        };
    }, [data]);
    return data;
}
