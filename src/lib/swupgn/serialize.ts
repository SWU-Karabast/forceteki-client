import type { SwuPgnDocument, Header } from './types';

// Header tag order mirrors parse()'s required set; optional Format is emitted when present.
const HEADER_ORDER: [keyof Header, string][] = [
    ['game', 'Game'], ['gameId', 'GameId'], ['date', 'Date'], ['format', 'Format'],
    ['cardPool', 'CardPool'], ['engine', 'Engine'], ['seed', 'Seed'],
    ['perspective', 'Perspective'], ['p1Id', 'P1Id'], ['p2Id', 'P2Id'],
    ['p1', 'P1'], ['p2', 'P2'], ['p1Leader', 'P1Leader'], ['p1Base', 'P1Base'],
    ['p2Leader', 'P2Leader'], ['p2Base', 'P2Base'], ['result', 'Result'],
    ['reason', 'Reason'], ['rounds', 'Rounds'],
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

/** Serialize a SwuPgnDocument back to a .swupgn string. Round-trips through parse(). */
export function serialize(doc: SwuPgnDocument): string {
    const out: string[] = [
        ...headerLines(doc.header),
        '',
        ...section('DECKS', doc.decks),
        '',
        ...section('SETUP', doc.setup),
        '',
        ...section('EVENTS', doc.events),
        '',
        ...section('ANNOTATIONS', doc.annotations),
    ];
    return out.join('\n') + '\n';
}
