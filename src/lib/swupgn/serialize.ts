import type { SwuPgnDocument, Header } from './types';
import type { ParseNotes } from './parse';
import { render } from './render';

// Header tags go out in the order the file wrote them (`ParseNotes.tagOrder`); this order is
// for a document parse() did not build. Every optional tag (§5.2) is emitted when present and
// skipped when absent, so an export carries back out exactly what came in — a
// dropped `RecorderErrors`, `Undos` or `Match` would quietly relabel a partial file as complete, or
// orphan a game from its match.
const HEADER_ORDER: [keyof Header, string][] = [
    ['game', 'Game'], ['writerRevision', 'WriterRevision'], ['gameId', 'GameId'], ['date', 'Date'], ['endDate', 'EndDate'],
    ['format', 'Format'],
    ['cardPool', 'CardPool'], ['engine', 'Engine'], ['seed', 'Seed'],
    ['perspective', 'Perspective'], ['p1Id', 'P1Id'], ['p2Id', 'P2Id'],
    ['p1', 'P1'], ['p2', 'P2'], ['p1Leader', 'P1Leader'], ['p1Base', 'P1Base'],
    ['p2Leader', 'P2Leader'], ['p2Base', 'P2Base'], ['result', 'Result'],
    ['reason', 'Reason'], ['rounds', 'Rounds'],
    ['match', 'Match'], ['gameNumber', 'GameNumber'], ['recorderErrors', 'RecorderErrors'],
    ['undos', 'Undos'],
];

/**
 * A header value as §4 and Appendix B allow it: no line break (a run of `\r`/`\n` becomes one
 * space, as the forceteki writer does), no other control character (the grammar's `tag-char`
 * excludes them), and only the `\\` and `\"` escapes.
 */
function esc(v: string): string {
    return v
        .replace(/[\r\n]+/g, ' ')
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u001f\u007f]/g, ' ')
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');
}

function headerLines(h: Header, order?: readonly string[], extraTags: readonly [string, string][] = []): string[] {
    const known = new Map(HEADER_ORDER.map(([key, tag]) => [tag, key]));
    const extra = new Map(extraTags);
    const line = (tag: string): string | undefined => {
        const key = known.get(tag);
        const value = key !== undefined ? h[key] : extra.get(tag);
        // optional tags (Format, Perspective) are skipped when absent
        return value === undefined || value === null ? undefined : `[${tag} "${esc(String(value))}"]`;
    };
    // The file's own tag order when parse() recorded it, so an export writes the header back
    // byte for byte; then anything it did not list, known tags in HEADER_ORDER, unknown after.
    // `Game` is always first (§4).
    const tags = [...new Set(['Game', ...(order ?? []), ...HEADER_ORDER.map(([, tag]) => tag), ...extraTags.map(([tag]) => tag)])];
    return tags.flatMap((tag) => line(tag) ?? []);
}

function section(name: string, records: unknown[]): string[] {
    return [`%%% ${name}`, ...records.map((r) => JSON.stringify(r))];
}

/**
 * Serialize a SwuPgnDocument back to a .swupgn string. Round-trips through parse().
 *
 * Sections go out in the spec's canonical order (§4): STORY first so a person who opens the
 * file reads the game, then DECKS, CARDS, SETUP, EVENTS, ANNOTATIONS. STORY and CARDS are
 * derived and optional, but this writer emits both: the only thing the client changes on
 * export is the annotation list, so the file's own prose still describes its events, and
 * without CARDS the exported copy would name nothing for a reader with no card database.
 * A document that arrived without a story gets one rendered from its own events (§16).
 *
 * The client is an Annotator (§3): it adds notes and changes nothing else, so what the file
 * carried and this version does not define goes back out verbatim (§3 [A-01], §18) -- unknown
 * header tags after the known ones, unknown sections (an `X_` extension's or a later version's)
 * after ANNOTATIONS. The first line is always `[Game …]`, no byte order mark is written, and the
 * file ends with one line feed (§3 [W-02]).
 */
export function serialize(doc: SwuPgnDocument & ParseNotes): string {
    // No story line may open a section: render() interpolates file-controlled strings (an
    // UNDO's `at`, a raw id, a token name), so a smuggled newline can put `%%%` at the start
    // of a line. parse() trims a line before it looks for a banner, so whitespace is no escape:
    // the line gets a leading middle dot, which trim() keeps.
    const story = (doc.story && doc.story.length > 0 ? doc.story : render(doc).split('\n'))
        .flatMap((l) => String(l).split(/\r?\n|\r/))
        .map((l) => (l.trim().startsWith('%%%') ? `\u00b7${l}` : l));
    const out: string[] = [
        ...headerLines(doc.header, doc.tagOrder, doc.extraTags),
        '',
        '%%% STORY',
        ...story,
        '',
        ...section('DECKS', doc.decks),
        '',
        ...section('CARDS', doc.cards ?? []),
        '',
        ...section('SETUP', doc.setup),
        '',
        ...section('EVENTS', doc.events),
        '',
        ...section('ANNOTATIONS', doc.annotations),
        ...(doc.extraSections ?? []).flatMap((x) => ['', x.banner, ...x.lines]),
    ];
    return out.join('\n') + '\n';
}
