import { useEffect, useState } from 'react';
import { baseId } from '@/lib/swupgn';

// public/card-costs.json is a static SET#NUM -> cost map generated from forceteki's card
// data (npm run gen:card-data). The resourcing report uses it to compute resources spent
// per round (sum of played-card costs). Bases/leaders have no entry (cost null). Fetched
// once and module-cached, like the card-name map.
const CARD_COSTS_URL = '/card-costs.json';
let cardCostMapPromise: Promise<Record<string, number>> | null = null;

export function loadCardCostMap(): Promise<Record<string, number>> {
    if (!cardCostMapPromise) {
        cardCostMapPromise = fetch(CARD_COSTS_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`card-costs.json ${res.status}`);
                return res.json() as Promise<Record<string, number>>;
            })
            .catch((err) => {
                // Non-fatal: the resourcing report degrades to count-only (no spend/float).
                console.warn('Failed to load card cost map; resourcing float will be unavailable.', err);
                cardCostMapPromise = null;
                return {};
            });
    }
    return cardCostMapPromise;
}

/** Cost of a card id (SET#NUM[:copy]) via the map, or undefined if unknown (no-cost / not loaded). */
export function costOf(id: string, map: Record<string, number>): number | undefined {
    return map[baseId(id)];
}

/** Hook: SET#NUM -> cost map, empty until the static JSON loads. */
export function useCardCostMap(): Record<string, number> {
    const [map, setMap] = useState<Record<string, number>>({});
    useEffect(() => {
        let active = true;
        loadCardCostMap().then((m) => {
            if (active) setMap(m);
        });
        return () => { active = false; };
    }, []);
    return map;
}
