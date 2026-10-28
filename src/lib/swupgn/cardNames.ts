import type { CardIndexRecord } from './types';
import { displayText } from './displayText';

/** Resolves a SET#NUM[:copy] id to a display name. Copy suffixes are stripped before lookup. */
export interface NameResolver {
    nameOf(id: string): string;

    /** The card's other side's name (`CardIndexRecord.backSideName`), if it has one. */
    backNameOf?(id: string): string | undefined;
}

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
    // Upstream drops the whole entry instead; flattening keeps a bad entry's other side.
    // Bidi and control characters are neutralised too (§23): every name the client shows
    // comes through here.
    const flat = (v: unknown) => (typeof v === 'string' ? displayText(v.replace(/[\r\n]+/g, ' ')) : undefined);
    const entries = cards.filter((c) => !!c && typeof c === 'object');
    const byId = new Map(entries.map((c) => [c.id, flat(c.name)]));
    const backById = new Map(entries.map((c) => [c.id, flat(c.backSideName)]));
    return {
        nameOf: (id: string) => byId.get(baseId(id)) ?? baseId(id),
        backNameOf: (id: string) => backById.get(baseId(id)),
    };
}
