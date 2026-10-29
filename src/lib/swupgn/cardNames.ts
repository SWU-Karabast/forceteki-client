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
    // comes through here. The §16 nm() cut runs LAST, on the name as shown: newlines are
    // flattened first (a run of them becomes one space) and bidi marks dropped, both of which
    // can only shorten it, so cutting after them is what keeps every name the client shows
    // within MAX_NAME_LENGTH. Upstream cuts the raw name, which it shows unchanged.
    const flat = (v: unknown) => (typeof v === 'string' ? shorten(displayText(v.replace(/[\r\n]+/g, ' '))) : undefined);
    const entries = cards.filter((c) => !!c && typeof c === 'object');
    const byId = new Map(entries.map((c) => [c.id, flat(c.name)]));
    const backById = new Map(entries.map((c) => [c.id, flat(c.backSideName)]));
    return {
        nameOf: (id: string) => byId.get(baseId(id)) ?? baseId(id),
        backNameOf: (id: string) => backById.get(baseId(id)),
    };
}

/** Longer than any printed card's `Title, Subtitle`. */
const MAX_NAME_LENGTH = 120;

/** Line breaks, other control characters and bidirectional controls, which a story line never holds (spec §16, §23). */
// eslint-disable-next-line no-control-regex
const NOT_ON_A_LINE = /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g;

/**
 * `name` as one story line (spec §16): each line break or other control character becomes a space,
 * then a result longer than 120 UTF-16 code units is cut to 119 and `…`.
 */
export function shorten(name: string): string {
    const flat = flatten(name);
    return flat.length > MAX_NAME_LENGTH ? `${flat.slice(0, MAX_NAME_LENGTH - 1)}…` : flat;
}

/** `text` with each line break, other control character and bidirectional control turned into a space (spec §16, R-04). */
export function flatten(text: string): string {
    return text.replace(NOT_ON_A_LINE, ' ');
}
