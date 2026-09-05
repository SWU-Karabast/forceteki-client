import { loadStaticJson, useStaticJson } from '@/app/_utils/staticJson';
import { baseId, tokenArtId } from '@/lib/swupgn';

// public/card-stats.json is a static SET#NUM -> {power,hp,arena,type,aspects,upgradePower,upgradeHp,grit} map generated from
// forceteki's per-card data (npm run gen:card-data). The board uses it to show power/HP
// stat badges on in-play units and the deployed-leader's unit stats — the .swupgn stream
// carries card ids but not printed stats. Fetched once and module-cached, like names/costs.
export interface CardStat {
    type?: string;     // 'unit' | 'leader' | 'base' | 'event' | 'upgrade'
    power?: number;
    hp?: number;
    arena?: string;    // 'ground' | 'space'
    aspects?: string[];// e.g. ['cunning','heroism'] — leader/base aspects
    id?: string;       // numeric engine id; tokens resolve their art by this, not by setId
    upgradePower?: number; // stat bonus this card grants when attached (upgrades, tokens, pilots)
    upgradeHp?: number;
    grit?: boolean;    // Grit keyword: the unit's power rises by its damage
}

const CARD_STATS_URL = '/card-stats.json';
const WARN = 'Failed to load card stat map; board stat badges will be hidden.';

export const loadCardStatMap = (): Promise<Record<string, CardStat>> => loadStaticJson<Record<string, CardStat>>(CARD_STATS_URL, WARN);

/** Hook: SET#NUM -> stats map, empty until the static JSON loads. */
export const useCardStatMap = (): Record<string, CardStat> => useStaticJson<Record<string, CardStat>>(CARD_STATS_URL, WARN);

// Token entries are keyed `TOKEN:<Title>` (the generator has no set number to key on), but a
// current file names a token `TOKEN:<internalName>#<numericId>[:copy]` (spec §6.1), and the
// spec says the numeric id is the part to resolve. Every token entry carries that id, so
// index them by it once per map. WeakMap: the map object is module-cached and never mutated.
const tokenIndexByMap = new WeakMap<Record<string, CardStat>, Map<string, CardStat>>();
function tokenById(map: Record<string, CardStat>, numericId: string): CardStat | undefined {
    let idx = tokenIndexByMap.get(map);
    if (!idx) {
        idx = new Map();
        for (const [k, v] of Object.entries(map)) if (k.startsWith('TOKEN:') && v.id) idx.set(v.id, v);
        tokenIndexByMap.set(map, idx);
    }
    return idx.get(numericId);
}

/**
 * Stats for a card id via the map, or undefined if unknown / not loaded.
 * Accepts `SET#NUM[:copy]`, the pre-1.0 `TOKEN:<Title>[:copy]`, and the current
 * `TOKEN:<name>#<numericId>[:copy]` -- the last resolved by its numeric id, since without
 * that a token UNIT (Mandalorian, X-Wing, Battle Droid...) had no stats, no `token` type, and
 * so no art: it rendered as a `SET#NUM` card from a set called `TOKEN:mandalorian`.
 */
export function statOf(id: string, map: Record<string, CardStat>): CardStat | undefined {
    const direct = map[baseId(id)];
    if (direct) return direct;
    const art = tokenArtId(id);
    return art ? tokenById(map, art) : undefined;
}
