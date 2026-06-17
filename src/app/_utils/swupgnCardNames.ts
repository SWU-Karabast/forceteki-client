import { baseId, type NameResolver } from '@/lib/swupgn';

/**
 * Build a NameResolver for the move list / decklist / captions. The .swupgn carries
 * only SET#NUM ids; this maps them to display names from an injected map, falling back
 * to the raw id when unknown (the board renders from images, so an unresolved name only
 * affects text). TOKEN:<label> refs render their label.
 */
export function makeNameResolver(map: Record<string, string>): NameResolver {
    return {
        nameOf(id: string): string {
            if (id.startsWith('TOKEN:')) return id.slice('TOKEN:'.length);
            return map[baseId(id)] ?? id;
        },
    };
}
