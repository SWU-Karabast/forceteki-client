import { useEffect, useState } from 'react';
import { baseId } from '@/lib/swupgn';

// public/card-stats.json is a static SET#NUM -> {power,hp,arena,type} map generated from
// forceteki's per-card data (npm run gen:card-data). The board uses it to show power/HP
// stat badges on in-play units and the deployed-leader's unit stats — the .swupgn stream
// carries card ids but not printed stats. Fetched once and module-cached, like names/costs.
export interface CardStat {
    type?: string;     // 'unit' | 'leader' | 'base' | 'event' | 'upgrade'
    power?: number;
    hp?: number;
    arena?: string;    // 'ground' | 'space'
}

const CARD_STATS_URL = '/card-stats.json';
let cardStatMapPromise: Promise<Record<string, CardStat>> | null = null;

export function loadCardStatMap(): Promise<Record<string, CardStat>> {
    if (!cardStatMapPromise) {
        cardStatMapPromise = fetch(CARD_STATS_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`card-stats.json ${res.status}`);
                return res.json() as Promise<Record<string, CardStat>>;
            })
            .catch((err) => {
                // Non-fatal: units render without power/HP badges if this can't load.
                console.warn('Failed to load card stat map; board stat badges will be hidden.', err);
                cardStatMapPromise = null;
                return {};
            });
    }
    return cardStatMapPromise;
}

/** Stats for a card id (SET#NUM[:copy]) via the map, or undefined if unknown / not loaded. */
export function statOf(id: string, map: Record<string, CardStat>): CardStat | undefined {
    return map[baseId(id)];
}

/** Hook: SET#NUM -> stats map, empty until the static JSON loads. */
export function useCardStatMap(): Record<string, CardStat> {
    const [map, setMap] = useState<Record<string, CardStat>>({});
    useEffect(() => {
        let active = true;
        loadCardStatMap().then((m) => {
            if (active) setMap(m);
        });
        return () => { active = false; };
    }, []);
    return map;
}
