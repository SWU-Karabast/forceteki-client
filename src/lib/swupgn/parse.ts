import type { SwuPgnDocument, Header, DeckRecord, GameEvent, Annotation, SetupInitRecord, CardIndexRecord } from './types';

function parseHeaderLine(line: string, raw: Record<string, string>): void {
    // A line may contain multiple [Tag "Value"] pairs.
    const re = /\[([A-Za-z0-9]+)\s+"((?:[^"\\]|\\.)*)"\]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
        raw[m[1]] = m[2].replace(/\\(.)/g, '$1');
    }
}

/**
 * Parse a numeric tag, falling back when it isn't a number.
 *
 * `[Rounds "seven"]` used to yield NaN, which is not an error anywhere and so propagated
 * silently into whatever consumed it. A wrong-but-finite value fails loudly at the point of
 * use; NaN fails nowhere and corrupts everything downstream.
 */
/**
 * A header count that is not a base-10 integer is corrupt, not zero.
 *
 * `finiteOr` runs at PARSE time, before any schema sees the value, so `[Undos "garbage"]` used
 * to become `undos: 0` and validate clean -- silently reporting "no undos happened" for a file
 * whose audit metadata was mangled. Returning undefined instead leaves the tag absent, which
 * the schema and every reader already handle, and keeps "absent" honestly distinct from "zero".
 */
function strictCount(value: string): number | undefined {
    // CLIENT-OWNED: a digit run past 2^53 is not a count either (400 nines parse to Infinity).
    return (/^\s*\d+\s*$/).test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : undefined;
}

function finiteOr(value: string, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

// CLIENT-OWNED. Spec §18: a reader MUST refuse a different major version and MUST accept any
// 1.x. Upstream leaves this to validate(), which the client does not ship (Node-only), so
// the gate lives at the one place every file passes through. The shape is matched, never
// compared numerically: §22.1 says a file declaring 1.1 is OLDER than 1.0, so `>=` is wrong.
const SUPPORTED_GAME_TAG = /^SWU-PGN\/1\.\d+$/;

// CLIENT-OWNED. Safety ceiling on event count. A real game is a few thousand events; this
// bounds the per-frame fold (O(n) per frame) and the snapshot array so a malformed or
// hostile file — replays are shared between users — can't freeze/OOM the tab. Upstream has
// no cap because it never builds per-frame snapshots; the viewer does.
const MAX_EVENTS = 200_000;

function buildHeader(raw: Record<string, string>): Header {
    const req = (k: string): string => {
        if (!(k in raw)) {
            throw new Error(`SWU-PGN: missing required header tag [${k}]`);
        }
        return raw[k];
    };
    const game = req('Game');
    if (!SUPPORTED_GAME_TAG.test(game)) {
        throw new Error(`SWU-PGN: unsupported format version [Game "${game}"] (this reader speaks SWU-PGN/1.x)`);
    }
    return {
        game, gameId: req('GameId'), date: req('Date'),
        format: raw['Format'], cardPool: req('CardPool'), engine: req('Engine'),
        seed: req('Seed'),
        // The 'as' casts below are intentional: structural parsing trusts the raw
        // string values here; enum/value validation is performed by validate(),
        // not the parser.
        perspective: (raw['Perspective'] as Header['perspective']) ?? null,
        p1Id: req('P1Id'), p2Id: req('P2Id'), p1: req('P1'), p2: req('P2'),
        p1Leader: req('P1Leader'), p1Base: req('P1Base'),
        p2Leader: req('P2Leader'), p2Base: req('P2Base'),
        result: req('Result') as Header['result'], reason: req('Reason'),
        rounds: finiteOr(req('Rounds'), 0),
        ...(strictCount(raw['RecorderErrors'] ?? '') !== undefined ? { recorderErrors: strictCount(raw['RecorderErrors']) } : {}),
        ...(strictCount(raw['Undos'] ?? '') !== undefined ? { undos: strictCount(raw['Undos']) } : {}),
        ...(strictCount(raw['WriterRevision'] ?? '') !== undefined ? { writerRevision: strictCount(raw['WriterRevision']) } : {}),
        ...(raw['EndDate'] != null ? { endDate: raw['EndDate'] } : {}),
        ...(raw['Match'] != null ? { match: raw['Match'] } : {}),
        ...(strictCount(raw['GameNumber'] ?? '') !== undefined ? { gameNumber: strictCount(raw['GameNumber']) } : {}),
    };
}

type Section = 'NONE' | 'UNKNOWN' | 'STORY' | 'DECKS' | 'CARDS' | 'SETUP' | 'EVENTS' | 'ANNOTATIONS';

/** Sections whose lines are NDJSON records. `STORY` is deliberately not one of them. */
export const JSON_SECTIONS = ['DECKS', 'CARDS', 'SETUP', 'EVENTS', 'ANNOTATIONS'];

/**
 * Every `%%%` banner this version knows. Exported so `validate()` warns on exactly the set
 * `parse()` accepts -- two hand-maintained copies drift, and the warning then fires on a
 * section the reader does happily parse, or stays silent on one it drops.
 */
export const KNOWN_SECTIONS: readonly string[] = ['STORY', ...JSON_SECTIONS];

/** Drop leading/trailing blank lines a section banner's spacing leaves around the prose. */
function trimBlankEdges(lines: string[]): string[] {
    let start = 0;
    let end = lines.length;
    while (start < end && lines[start].trim() === '') {
        start++;
    }
    while (end > start && lines[end - 1].trim() === '') {
        end--;
    }
    return lines.slice(start, end);
}

/**
 * CLIENT-OWNED: what parse() read but could not use, for File Health. A header count that is
 * present but unreadable is absent from `header` (strictCount), and that must not read as "none":
 * a garbled RecorderErrors would pass a partial file as complete. A skipped section (a later
 * version's, §18, or a misspelled banner) is named so it is not silently empty.
 */
export interface ParseNotes {
    unreadableTags?: Record<string, string>;
    skippedSections?: string[];
}
export type ParsedDocument = SwuPgnDocument & ParseNotes;

/** The §5.2 header counts strictCount reads. */
const COUNT_TAGS = ['RecorderErrors', 'Undos', 'WriterRevision', 'GameNumber'];

export function parse(text: string): ParsedDocument {
    const raw: Record<string, string> = {};
    const skipped = new Set<string>();
    const story: string[] = [];
    const decks: DeckRecord[] = [];
    const cards: CardIndexRecord[] = [];
    const setup: (SetupInitRecord | GameEvent)[] = [];
    const events: GameEvent[] = [];
    const annotations: Annotation[] = [];
    let section: Section = 'NONE';

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();

        // %%% STORY is prose, not NDJSON: keep every line verbatim (blank lines included,
        // they are part of the layout) until the next banner.
        if (section === 'STORY' && !line.startsWith('%%%')) {
            story.push(rawLine.replace(/\r$/, ''));
            continue;
        }
        if (line.length === 0) {
            continue;
        }
        // Header lines only exist before the first banner (spec §4). Inside a JSON section a
        // `[`-prefixed line is a record (a JSON array), and must reach the JSON path below so
        // that validate() can reject it, rather than vanish as a mis-parsed header.
        if (section === 'NONE' && line.startsWith('[')) {
            parseHeaderLine(line, raw);
            continue;
        }
        if (line.startsWith('%%%')) {
            const name = line.slice(3).trim()
                .toUpperCase();
            section = (name === 'STORY' || JSON_SECTIONS.includes(name) ? name : 'UNKNOWN') as Section;
            if (section === 'UNKNOWN' && skipped.size < 20) {
                skipped.add(name.slice(0, 40));
            }
            continue;
        }
        // CLIENT-OWNED: skip a later version's section before JSON.parse, so one whose lines
        // are prose (STORY-style) is ignored too, as §18 asks, instead of failing the file.
        if (section === 'UNKNOWN') {
            continue;
        }
        let rec: unknown;
        try {
            rec = JSON.parse(line);
        } catch {
            throw new Error(`SWU-PGN: invalid JSON on line ${i + 1}`);
        }
        // CLIENT-OWNED. Every record is an object (§4). A bare `null`, number or array is
        // valid JSON, and it used to reach `events[i].seq` in the viewer, crash the page,
        // and be persisted first, so the `?id=` link crash-looped on every reload. Upstream
        // leaves this to validate(), which the client does not ship.
        if (rec == null || typeof rec !== 'object' || Array.isArray(rec)) {
            throw new Error(`SWU-PGN: record on line ${i + 1} is not a JSON object`);
        }
        switch (section) {
            case 'DECKS': decks.push(rec as DeckRecord); break;
            case 'CARDS': cards.push(rec as CardIndexRecord); break;
            case 'SETUP': setup.push(rec as SetupInitRecord | GameEvent); break;
            case 'EVENTS':
                if (events.length >= MAX_EVENTS) {
                    throw new Error(`SWU-PGN: too many events (limit ${MAX_EVENTS})`);
                }
                events.push(rec as GameEvent);
                break;
            case 'ANNOTATIONS': annotations.push(rec as Annotation); break;
            default: throw new Error(`SWU-PGN: record before any %%% section on line ${i + 1}`);
        }
    }

    const unreadable = Object.fromEntries(COUNT_TAGS
        .filter((tag) => raw[tag] != null && strictCount(raw[tag]) === undefined)
        .map((tag) => [tag, raw[tag]]));
    return {
        header: buildHeader(raw), story: trimBlankEdges(story), decks, cards, setup, events, annotations,
        ...(Object.keys(unreadable).length ? { unreadableTags: unreadable } : {}),
        ...(skipped.size ? { skippedSections: [...skipped] } : {}),
    };
}
