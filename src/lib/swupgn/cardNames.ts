import type { CardIndexRecord } from './types';

/** Resolves a SET#NUM[:copy] id to a display name. Copy suffixes are stripped before lookup. */
export interface NameResolver { nameOf(id: string): string; }

export function baseId(ref: string): string {
    return String(ref).replace(/:\d+$/, '');
}

/**
 * A resolver backed by the file's own `%%% CARDS` index.
 *
 * This is what makes a `.swupgn` self-describing: with the index present, rendering the
 * story needs no external card database. An id the index doesn't cover falls back to the id
 * itself, so an incomplete index degrades to today's behaviour rather than losing the event.
 */
export function indexResolver(cards: readonly CardIndexRecord[] = []): NameResolver {
    // CLIENT-OWNED: entries and `name` come off JSON.parse of an upload. A `null` line threw
    // here; a numeric name reached DeckTab's `localeCompare`; a newline reached serialize(),
    // where a rendered story line beginning `%%%` would end the exported STORY section.
    const byId = new Map(cards.filter((c) => !!c && typeof c === 'object')
        .map((c) => [c.id, typeof c.name === 'string' ? c.name.replace(/[\r\n]+/g, ' ') : undefined]));
    return { nameOf: (id: string) => byId.get(baseId(id)) ?? baseId(id) };
}
