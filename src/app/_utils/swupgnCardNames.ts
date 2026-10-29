import { useStaticJson } from '@/app/_utils/staticJson';
import { storyName } from '@/app/_utils/replayAction';
import { baseId, displayText, isTokenPseudoCard, looseTokenName, shorten, type NameResolver, type ReducedState, type Seat } from '@/lib/swupgn';

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
                const name = looseTokenName(id);
                return name.replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());
            }
            const key = baseId(id);
            return (Object.hasOwn(map, key) ? map[key] : undefined) ?? String(id);
        },
    };
}

/** A resolver that also names a card's printed front, whichever side is up. */
export interface SidedNameResolver extends NameResolver {
    frontNameOf(id: string): string;
}

/**
 * Name a card with two names (`backSideName`, spec §6.5) by the side that is UP in `state`:
 * a deployed Grand Moff Tarkin is The Death Star, a flipped Chancellor Palpatine is Darth
 * Sidious. The seat's folded `leader` status says which: the same rule render()'s
 * `trackSides` applies from the records, keyed like it on the EXACT id, so a mirror match's
 * `SET#NUM:2` keeps its own side. A unit that is a copy of another card (CR 8.5: `copyOf` and
 * `name` on its folded entry) goes by the copied name while it lasts, as render()'s `copies`
 * names it; the name is the file's text, so it is made safe and cut like an index name.
 * Every other id resolves as `n` does.
 */
export function sidedResolver(n: NameResolver, state: ReducedState | undefined): SidedNameResolver {
    const backUp = new Set<string>();
    const copies = new Map<string, string>();
    // Every id in an arena, on either seat: as a unit, or attached to one (a pilot).
    const inArena = new Set<string>();
    for (const seat of [1, 2] as Seat[]) {
        const cards = state?.players?.[seat]?.cards;
        if (!Array.isArray(cards)) continue;
        for (const c of cards) {
            if (typeof c?.id === 'string') inArena.add(c.id);
            if (typeof c?.id === 'string' && typeof c.copyOf === 'string' && typeof c.name === 'string') {
                copies.set(c.id, shorten(displayText(c.name.replace(/[\r\n]+/g, ' '))));
            }
            if (Array.isArray(c?.upgrades)) for (const u of c.upgrades) if (typeof u === 'string') inArena.add(u);
        }
    }
    for (const seat of [1, 2] as Seat[]) {
        const leader = state?.players?.[seat]?.leader;
        if (leader && typeof leader.id === 'string') {
            // A leader in an arena is deployed even when no DEPLOY_LEADER said so: render()
            // turns it over on any MOVE base -> arena, as a unit or as a pilot.
            if (leader.deployed === true || leader.onStartingSide === false || inArena.has(leader.id)) backUp.add(leader.id);
        }
    }
    return {
        // Sides are keyed on the EXACT id: in a mirror match one seat's copy is `SET#NUM:2`
        // (§11), and turning one seat's leader over must not rename the other's. Names are per
        // card, so `n` is asked by base id, as render() does: a resolver need not strip `:N`.
        nameOf: (id: string) => copies.get(String(id)) ?? (backUp.has(String(id)) ? n.backNameOf?.(baseId(id)) : undefined) ?? n.nameOf(baseId(id)),
        backNameOf: (id: string) => n.backNameOf?.(baseId(id)),
        frontNameOf: (id: string) => n.nameOf(baseId(id)),
    };
}

/**
 * A card's story name as it reads at record `seq` (the side up at that frame, §6.5); its printed
 * front when no record has that seq, e.g. a bookmark saved against an older copy of the file.
 */
export function nameAtSeq(
    n: NameResolver, frames: readonly (ReducedState | undefined)[], frameBySeq: ReadonlyMap<unknown, number>, id: string, seq: string,
): string {
    const frame = frameBySeq.get(seq);
    return storyName(id, frame === undefined ? n : sidedResolver(n, frames[frame]));
}

// public/card-names.json is a static SET#NUM -> title map generated from forceteki's
// card data (npm run gen:card-data).
const CARD_NAMES_URL = '/card-names.json';
const WARN = 'Failed to load card name map; move list will show ids.';

/** Hook: SET#NUM -> title map, empty until the static JSON loads. */
export const useCardNameMap = (): Record<string, string> => useStaticJson<Record<string, string>>(CARD_NAMES_URL, WARN);
