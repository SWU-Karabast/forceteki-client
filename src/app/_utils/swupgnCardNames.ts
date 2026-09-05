import { loadStaticJson, useStaticJson } from '@/app/_utils/staticJson';
import { baseId, isTokenPseudoCard, tokenName, type NameResolver } from '@/lib/swupgn';

/**
 * Build a NameResolver for the move list / decklist / captions. The .swupgn carries
 * only SET#NUM ids; this maps them to display names from an injected map, falling back
 * to the raw id when unknown (the board renders from images, so an unresolved name only
 * affects text).
 *
 * Token ids carry their shape in the string — `TOKEN:Advantage:2` (pre-1.0 copy suffix) and
 * `TOKEN:advantage#5844562972` (1.0 numeric art id) — so slicing the prefix alone leaked
 * "Advantage:2" / "advantage#5844562972" into captions. A 1.0 file normally resolves names
 * from its own `%%% CARDS` index, but that section is OPTIONAL, so this path still sees them.
 */
export function makeNameResolver(map: Record<string, string>): NameResolver {
    return {
        nameOf(id: string): string {
            if (isTokenPseudoCard(id)) {
                const name = tokenName(id);
                return name.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());
            }
            return map[baseId(id)] ?? String(id);
        },
    };
}

// public/card-names.json is a static SET#NUM -> title map generated from forceteki's
// card data (npm run gen:card-data).
const CARD_NAMES_URL = '/card-names.json';
const WARN = 'Failed to load card name map; move list will show ids.';

export const loadCardNameMap = (): Promise<Record<string, string>> => loadStaticJson<Record<string, string>>(CARD_NAMES_URL, WARN);

/** Hook: SET#NUM -> title map, empty until the static JSON loads. */
export const useCardNameMap = (): Record<string, string> => useStaticJson<Record<string, string>>(CARD_NAMES_URL, WARN);
