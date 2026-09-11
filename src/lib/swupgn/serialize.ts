import type { SwuPgnDocument, Header } from './types';
import { render } from './render';

// Header tag order mirrors parse()'s required set; every optional tag (§5.2) is emitted when
// present and skipped when absent, so an export carries back out exactly what came in — a
// dropped `RecorderErrors` or `Match` would quietly relabel a partial file as complete, or
// orphan a game from its match.
const HEADER_ORDER: [keyof Header, string][] = [
    ['game', 'Game'], ['gameId', 'GameId'], ['date', 'Date'], ['endDate', 'EndDate'],
    ['format', 'Format'],
    ['cardPool', 'CardPool'], ['engine', 'Engine'], ['seed', 'Seed'],
    ['perspective', 'Perspective'], ['p1Id', 'P1Id'], ['p2Id', 'P2Id'],
    ['p1', 'P1'], ['p2', 'P2'], ['p1Leader', 'P1Leader'], ['p1Base', 'P1Base'],
    ['p2Leader', 'P2Leader'], ['p2Base', 'P2Base'], ['result', 'Result'],
    ['reason', 'Reason'], ['rounds', 'Rounds'],
    ['match', 'Match'], ['gameNumber', 'GameNumber'], ['recorderErrors', 'RecorderErrors'],
];

function esc(v: string): string {
    return v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function headerLines(h: Header): string[] {
    const lines: string[] = [];
    for (const [key, tag] of HEADER_ORDER) {
        const value = h[key];
        if (value === undefined || value === null) continue; // optional tags (Format, Perspective)
        lines.push(`[${tag} "${esc(String(value))}"]`);
    }
    return lines;
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
 */
export function serialize(doc: SwuPgnDocument): string {
    const story = doc.story && doc.story.length > 0 ? doc.story : render(doc).split('\n');
    const out: string[] = [
        ...headerLines(doc.header),
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
    ];
    return out.join('\n') + '\n';
}
