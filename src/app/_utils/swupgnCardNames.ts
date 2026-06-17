import { useEffect, useState } from 'react';
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

// public/card-names.json is a static SET#NUM -> title map generated from forceteki's
// card data (npm run gen:card-names). We fetch it once and module-cache the promise so
// every replay that loads in this session shares one network round-trip.
const CARD_NAMES_URL = '/card-names.json';
let cardNameMapPromise: Promise<Record<string, string>> | null = null;

export function loadCardNameMap(): Promise<Record<string, string>> {
    if (!cardNameMapPromise) {
        cardNameMapPromise = fetch(CARD_NAMES_URL)
            .then((res) => {
                if (!res.ok) throw new Error(`card-names.json ${res.status}`);
                return res.json() as Promise<Record<string, string>>;
            })
            .catch((err) => {
                // Non-fatal: the viewer falls back to raw SET#NUM ids. Reset the cache so a
                // later mount can retry rather than reusing the rejected promise forever.
                console.warn('Failed to load card name map; move list will show ids.', err);
                cardNameMapPromise = null;
                return {};
            });
    }
    return cardNameMapPromise;
}

/**
 * Hook: returns the SET#NUM -> title map, empty until the static JSON loads. Components
 * stay responsive on first paint (ids show), then re-render with names once it arrives.
 */
export function useCardNameMap(): Record<string, string> {
    const [map, setMap] = useState<Record<string, string>>({});
    useEffect(() => {
        let active = true;
        loadCardNameMap().then((m) => {
            if (active) setMap(m);
        });
        return () => {
            active = false;
        };
    }, []);
    return map;
}
