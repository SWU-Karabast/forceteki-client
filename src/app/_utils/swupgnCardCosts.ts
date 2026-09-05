import { baseId } from '@/lib/swupgn';
import { loadStaticJson, useStaticJson } from '@/app/_utils/staticJson';

// public/card-costs.json is a static SET#NUM -> cost map generated from forceteki's card
// data (npm run gen:card-data). The resourcing report uses it to compute resources spent
// per round (sum of played-card costs). Bases/leaders have no entry (cost null).
const CARD_COSTS_URL = '/card-costs.json';
const WARN = 'Failed to load card cost map; resourcing float will be unavailable.';

export const loadCardCostMap = (): Promise<Record<string, number>> => loadStaticJson<Record<string, number>>(CARD_COSTS_URL, WARN);

/** Hook: SET#NUM -> cost map, empty until the static JSON loads. */
export const useCardCostMap = (): Record<string, number> => useStaticJson<Record<string, number>>(CARD_COSTS_URL, WARN);

/** Cost of a card id (SET#NUM[:copy]) via the map, or undefined if unknown (no-cost / not loaded). */
export function costOf(id: string, map: Record<string, number>): number | undefined {
    return map[baseId(id)];
}
